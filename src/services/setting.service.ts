import { Setting, SettingCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';

export const listCompanySettings = async (companyId: number) =>
  Setting.findAll({
    where: { companyId, scope: 'company' },
    order: [['key', 'ASC']],
  });

export const getSetting = async (companyId: number | null, key: string) =>
  Setting.findOne({ where: { companyId, key } });

/** Upsert by (companyId, key). */
export const upsertSetting = async (data: SettingCreationAttributes): Promise<Setting> => {
  const existing = await Setting.findOne({
    where: { companyId: data.companyId ?? null, key: data.key },
  });
  if (existing) {
    existing.value = data.value;
    existing.scope = data.scope ?? existing.scope;
    if (data.description !== undefined) existing.description = data.description;
    await existing.save();
    return existing;
  }
  return Setting.create(data);
};

export const deleteSetting = async (uuid: string, companyId: number | null): Promise<void> => {
  const s = await Setting.findOne({ where: { uuid, companyId } });
  if (!s) throw new NotFoundError('Setting not found');
  await s.destroy();
};
