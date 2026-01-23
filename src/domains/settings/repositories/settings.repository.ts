/**
 * Settings repository - Data access layer for settings
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Setting, CreateSettingData, UpdateSettingData, SettingGroup } from '../types/settings.types';

export class SettingsRepository {
  async findByKey(key: string): Promise<Setting | null> {
    const result = await prisma.setting.findUnique({
      where: { key },
    });
    return result as Setting | null;
  }

  async findByGroup(group: SettingGroup): Promise<Setting[]> {
    const results = await prisma.setting.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });
    return results as Setting[];
  }

  async findAll(): Promise<Setting[]> {
    const results = await prisma.setting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return results as Setting[];
  }

  async create(data: CreateSettingData): Promise<Setting> {
    const result = await prisma.setting.create({
      data: {
        key: data.key,
        value: data.value,
        type: data.type || 'string',
        group: data.group,
        description: data.description,
      },
    });
    return result as Setting;
  }

  async update(key: string, data: UpdateSettingData): Promise<Setting> {
    const result = await prisma.setting.update({
      where: { key },
      data: {
        value: data.value,
        type: data.type,
        description: data.description,
      },
    });
    return result as Setting;
  }

  async upsert(key: string, data: CreateSettingData): Promise<Setting> {
    const result = await prisma.setting.upsert({
      where: { key },
      update: {
        value: data.value,
        type: data.type || 'string',
        description: data.description,
      },
      create: {
        key: data.key,
        value: data.value,
        type: data.type || 'string',
        group: data.group,
        description: data.description,
      },
    });
    return result as Setting;
  }

  async bulkUpsert(settings: Array<{ key: string; value: string; group: SettingGroup }>): Promise<void> {
    await prisma.$transaction(
      settings.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            type: 'string',
            group: setting.group,
          },
        })
      )
    );
  }

  async delete(key: string): Promise<void> {
    await prisma.setting.delete({
      where: { key },
    });
  }
}

