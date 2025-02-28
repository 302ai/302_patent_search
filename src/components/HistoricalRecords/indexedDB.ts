import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ISearchData } from '../AdvancedSearch';

export interface IPatentList {
  pdf: string; // pdf
  title: string; // 标题
  snippet: string; // 摘录
  language: string; // 语言
  inventor: string; // 作者
  assignee: string; // 受让人
  patent_id: string; // 唯一id
  grant_date: string;// 特权日
  filing_date: string; // 申请日
  publication_date: string;// 发布日期
  publication_number: string; // 专利号
  translate_title: string;
  translated_title: string; // 翻译标题
  figures: Array<{ thumbnail: string; full: string }>; // 专利图片数组
}

export interface IAIPatentRecordList {
  id?: number;
  type: 'search' | 'summary' | 'translate',
  title: string;
  translateFiel?: {
    url:string;
    language: string;
  };
  language: string;
  abstract?: {
    translationSummaryText:string
    item: IPatentList,
  };
  search?: {
    list: IPatentList[],
    searchData: ISearchData,
    sortBy: 'relevance' | '-submitted_date',
    query: string,
    next_page: boolean,
    total_results: number,
  }
  created_at: string;
}

const DB_NAME = 'ai-patent-database';
const STORE_NAME = 'ai-patent-store';

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: IAIPatentRecordList
  };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
}

export async function addData(data: IAIPatentRecordList): Promise<IAIPatentRecordList> {
  delete data.id;
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  // 返回插入数据后的主键值
  const id = await store.add(data);
  await tx.done;

  // 返回带有新生成 id 的数据
  return { ...data, id };
}

export async function getDataList(): Promise<IAIPatentRecordList[]> {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
  const allRecords = await store.getAll();
  //@ts-ignore
  const result = allRecords.sort((a, b) => b.id - a.id);
  return result;
}

// 删除
export async function deleteData(id: number): Promise<IAIPatentRecordList[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
  const result = await getDataList();
  return result;
}