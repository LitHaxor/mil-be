import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { LogBook, LogType } from '../entities/log-book.entity';

export interface AutoLogParams {
  logType: LogType;
  actorId: string;
  description: string;
  workshopId?: string;
  userUnitId?: string;
  entryId?: string;
  jobCardId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AutoLoggerService {
  constructor(
    @InjectRepository(LogBook)
    private logBookRepository: Repository<LogBook>,
  ) {}

  /**
   * Create a log entry automatically
   * @param params Log parameters
   * @param manager Optional EntityManager for transaction support
   */
  async log(params: AutoLogParams, manager?: EntityManager): Promise<LogBook> {
    const repo = manager
      ? manager.getRepository(LogBook)
      : this.logBookRepository;

    const logEntry = repo.create({
      log_type: params.logType,
      performed_by_id: params.actorId,
      description: params.description,
      user_unit_id: params.userUnitId,
      metadata: {
        workshop_id: params.workshopId,
        entry_id: params.entryId,
        job_card_id: params.jobCardId,
        ...params.metadata,
      },
    });

    return await repo.save(logEntry);
  }

  /**
   * Create multiple log entries in batch
   * @param paramsArray Array of log parameters
   * @param manager Optional EntityManager for transaction support
   */
  async logBatch(
    paramsArray: AutoLogParams[],
    manager?: EntityManager,
  ): Promise<LogBook[]> {
    const repo = manager
      ? manager.getRepository(LogBook)
      : this.logBookRepository;

    const logEntries = paramsArray.map((params) =>
      repo.create({
        log_type: params.logType,
        performed_by_id: params.actorId,
        description: params.description,
        user_unit_id: params.userUnitId,
        metadata: {
          workshop_id: params.workshopId,
          entry_id: params.entryId,
          job_card_id: params.jobCardId,
          ...params.metadata,
        },
      }),
    );

    return await repo.save(logEntries);
  }
}
