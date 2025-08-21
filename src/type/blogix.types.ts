export interface IBLogixDocuments {
  documents: IBLogixDocument[]
}

export interface IBLogixDocument  {
    id: string
    doc_type: number
    doc_id: string
    status: number
    owner: 0 | 1
    created: string
    updated: string
}