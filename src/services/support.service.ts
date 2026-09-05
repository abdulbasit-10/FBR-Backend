import { Op, WhereOptions } from 'sequelize';
import { SupportTicket } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

export interface ListSupportQuery extends PaginationParams {
  status?: string;
  priority?: string;
}

const nextTicketNo = async (companyId: number): Promise<string> => {
  const last = await SupportTicket.findOne({
    where: { companyId },
    order: [['id', 'DESC']],
    attributes: ['ticketNo'],
    paranoid: false,
  });
  const num = last?.ticketNo ? parseInt(last.ticketNo.replace('SR-', ''), 10) || 0 : 0;
  return `SR-${String(num + 1).padStart(4, '0')}`;
};

export const listTickets = async (
  companyId: number,
  q: ListSupportQuery,
): Promise<PaginatedResult<SupportTicket>> => {
  const { page, limit, offset } = normalisePagination(q);
  const where: WhereOptions = { companyId };
  const w = where as Record<string, unknown>;
  if (q.status) w.status = q.status;
  if (q.priority) w.priority = q.priority;
  if (q.search) {
    (w[Op.or as unknown as string] as unknown) = [
      { ticketNo: { [Op.like]: `%${q.search}%` } },
      { title: { [Op.like]: `%${q.search}%` } },
      { description: { [Op.like]: `%${q.search}%` } },
    ];
  }
  const { rows, count } = await SupportTicket.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getTicketByUuid = async (uuid: string, companyId: number): Promise<SupportTicket> => {
  const t = await SupportTicket.findOne({ where: { uuid, companyId } });
  if (!t) throw new NotFoundError('Ticket not found');
  return t;
};

export interface CreateTicketInput {
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
}

export const createTicket = async (
  companyId: number,
  userId: number,
  data: CreateTicketInput,
): Promise<SupportTicket> => {
  const ticketNo = await nextTicketNo(companyId);
  return SupportTicket.create({
    companyId,
    createdBy: userId,
    ticketNo,
    title: data.title,
    description: data.description ?? null,
    category: data.category ?? null,
    priority: data.priority ?? 'Normal',
    status: 'Open',
  });
};

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export const updateTicket = async (
  uuid: string,
  companyId: number,
  data: UpdateTicketInput,
): Promise<SupportTicket> => {
  const t = await getTicketByUuid(uuid, companyId);
  if (data.status === 'Resolved' && t.status !== 'Resolved') {
    (data as UpdateTicketInput & { resolvedAt?: Date }).resolvedAt = new Date();
  }
  await t.update(data);
  return t;
};

export const deleteTicket = async (uuid: string, companyId: number): Promise<void> => {
  const t = await getTicketByUuid(uuid, companyId);
  await t.destroy();
};

export const attachFile = async (
  uuid: string,
  companyId: number,
  attachmentUrl: string,
): Promise<SupportTicket> => {
  const t = await getTicketByUuid(uuid, companyId);
  t.attachmentUrl = attachmentUrl;
  await t.save();
  return t;
};
