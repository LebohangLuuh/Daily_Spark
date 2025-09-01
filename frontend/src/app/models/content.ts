
export interface Content {
    _id?: string;
    text: string;
    type: string;
    author: string;
    createdAt?: Date;
    isApproved?: boolean;
    aiGenerated?: boolean;
}