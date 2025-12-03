import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb-browser';

type BaseRecord = PouchDB.Core.IdMeta & {
  table: string;
};

type TestCounterRecord = BaseRecord & {
  table: 'test_counter';
  counter: number;
};

type CredentialsRecord = BaseRecord & {
  table: 'credentials';
  pin: string;
};

type SettingsLlmRecord = BaseRecord & {
  table: 'settings_llm';
  llmUrl: string;
  apiKey: string;
};

export type KidRecord = BaseRecord & {
  table: 'kids';
  kidId: string;
  nickname: string;
  birthYear: number;
  birthMonth: number;
  disabled: boolean;
};

type DbRecord = TestCounterRecord | CredentialsRecord | SettingsLlmRecord | KidRecord;

export type SavedRecord = Required<Pick<TestCounterRecord, '_id' | 'table' | 'counter'>>;

@Injectable({
  providedIn: 'root'
})
export class PouchDbService {
  // Single app-wide database instance
  private readonly db = new PouchDB<DbRecord>('app-db');
  private readonly credentialsId = 'credentials';
  private readonly settingsLlmId = 'settings_llm';
  private readonly kidIdPrefix = 'kid_';

  async addTestCounterEntry(): Promise<SavedRecord> {
    const nextCounter = await this.getNextCounter();
    const doc: TestCounterRecord = {
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

  async hasCredentials(): Promise<boolean> {
    try {
      const doc = await this.db.get(this.credentialsId);
      return doc.table === 'credentials' && typeof (doc as CredentialsRecord).pin === 'string';
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 404) {
        return false;
      }
      throw err;
    }
  }

  async saveCredentials(pin: string): Promise<void> {
    try {
      const existing = await this.db.get(this.credentialsId);
      await this.db.put({
        _id: this.credentialsId,
        _rev: existing._rev,
        table: 'credentials',
        pin
      });
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 404) {
        await this.db.put({
          _id: this.credentialsId,
          table: 'credentials',
          pin
        });
        return;
      }
      throw err;
    }
  }

  async validatePin(pin: string): Promise<boolean> {
    try {
      const doc = await this.db.get(this.credentialsId);
      return doc.table === 'credentials' && (doc as CredentialsRecord).pin === pin;
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 404) {
        return false;
      }
      throw err;
    }
  }

  async getLlmSettings(): Promise<SettingsLlmRecord | null> {
    try {
      const doc = await this.db.get(this.settingsLlmId);
      if (doc.table === 'settings_llm') {
        return doc as SettingsLlmRecord;
      }
      return null;
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async saveLlmSettings(llmUrl: string, apiKey: string): Promise<void> {
    try {
      const existing = await this.db.get(this.settingsLlmId);
      await this.db.put({
        _id: this.settingsLlmId,
        _rev: existing._rev,
        table: 'settings_llm',
        llmUrl,
        apiKey
      });
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 404) {
        await this.db.put({
          _id: this.settingsLlmId,
          table: 'settings_llm',
          llmUrl,
          apiKey
        });
        return;
      }
      throw err;
    }
  }

  async exportAll(): Promise<string> {
    const { rows } = await this.db.allDocs({ include_docs: true });
    type Existing = PouchDB.Core.ExistingDocument<DbRecord>;
    const docs = rows
      .map((row) => row.doc as Existing | undefined)
      .filter((doc): doc is Existing => Boolean(doc));

    return JSON.stringify(docs, null, 2);
  }

  async listKids(): Promise<KidRecord[]> {
    const { rows } = await this.db.allDocs({ include_docs: true });
    type Existing = PouchDB.Core.ExistingDocument<DbRecord>;
    return rows
      .map((row) => row.doc as Existing | undefined)
      .filter((doc): doc is Existing => Boolean(doc) && (doc as Existing).table === 'kids')
      .map((doc) => doc as KidRecord)
      .sort((a, b) => a.nickname.localeCompare(b.nickname));
  }

  async addKid(kidId: string, nickname: string, birthYear: number, birthMonth: number): Promise<void> {
    const doc: KidRecord = {
      _id: `${this.kidIdPrefix}${kidId}`,
      table: 'kids',
      kidId,
      nickname,
      birthYear,
      birthMonth,
      disabled: false
    };
    await this.db.put(doc);
  }

  async updateKid(
    kidId: string,
    updates: Partial<Pick<KidRecord, 'nickname' | 'birthYear' | 'birthMonth' | 'disabled'>>
  ): Promise<void> {
    const doc = await this.db.get(`${this.kidIdPrefix}${kidId}`);
    if (doc.table !== 'kids') {
      throw new Error('Record is not a kid entry.');
    }
    const kidDoc = doc as PouchDB.Core.ExistingDocument<KidRecord>;
    await this.db.put({
      ...kidDoc,
      ...updates
    });
  }

  async deleteKid(kidId: string): Promise<void> {
    const doc = await this.db.get(`${this.kidIdPrefix}${kidId}`);
    await this.db.remove(doc);
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
      .map((doc) => (doc as TestCounterRecord).counter);

    const maxCounter = counters.length ? Math.max(...counters) : 0;
    return maxCounter + 1;
  }
}
