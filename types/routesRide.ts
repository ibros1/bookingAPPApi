// ---------- ROUTE ----------
export interface iCreatedRoute {
  userId: string;
  from: string;
  end: string;
}

export interface iUpdatedRoute {
  id: string;
  from?: string;
  end?: string;
}
