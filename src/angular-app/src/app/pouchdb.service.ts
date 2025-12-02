import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb-browser';

type DbRecord = PouchDB.Core.IdMeta & {
  table: string;
  counter: number;
};

export type SavedRecord = Required<Pick<DbRecord, '_id' | 'table' | 'counter'>>;

@Injectable({
  providedIn: 'root'
})
export class PouchDbService {
  // Single app-wide database instance
  private readonly db = new PouchDB<DbRecord>('app-db');

  async addTestCounterEntry(): Promise<SavedRecord> {
    const nextCounter = await this.getNextCounter();
    const doc: DbRecord = {
      _id: `test_counter_${Date.now()}`,
      table: 'test_counter',
      counter: nextCounter
    };

    const result = await this.db.put(doc);

    return {
      _id: result.id,
      table: doc.table,
      counter: doc.counter
    };
  }

  private async getNextCounter(): Promise<number> {
    const { rows } = await this.db.allDocs({ include_docs: true });
    type ExistingDbRecord = PouchDB.Core.ExistingDocument<DbRecord>;

    const counters = rows
      .map((row) => row.doc)
      .filter(
        (doc): doc is ExistingDbRecord =>
          Boolean(doc) && (doc as ExistingDbRecord).table === 'test_counter'
      )
      .map((doc) => doc.counter);

    const maxCounter = counters.length ? Math.max(...counters) : 0;
    return maxCounter + 1;
  }
}
