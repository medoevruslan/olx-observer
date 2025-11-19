import { Query } from "../models/Query.ts";
import type { QueryModel } from "../models/Query.ts";

export async function getQueriesFromDb(): Promise<QueryModel[]> {
  const queries = await Query.findAll();
  return queries as unknown as QueryModel[];
}

export async function updateQueryById<T extends keyof QueryModel>(
  id: number,
  field: T,
  value: QueryModel[T]
) {
  return await Query.update({ [field]: value }, { where: { id } });
}

export async function deleteById(id: number) {
  return await Query.destroy({ where: { id: id } });
}

export async function getQueryById(id: number) {
  return await Query.findByPk(id);
}
