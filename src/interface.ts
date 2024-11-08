export interface IPatentList {
    pdf: string; // PDF document
    title: string; // Title
    snippet: string; // Extract or snippet
    language: string; // Language
    inventor: string; // Inventor
    assignee: string; // Assignee
    patent_id: string; // Unique ID
    grant_date: string; // Date of grant
    filing_date: string; // Filing date
    publication_date: string; // Publication date
    publication_number: string; // Patent number
    translate_title: string; // Title for translation
    translated_title: string; // Translated title
    figures: Array<{ thumbnail: string; full: string }>; // Array of patent images
}
export type DataSource = { total_results: number, next_page: boolean, list: Array<IPatentList> };