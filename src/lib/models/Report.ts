import clientPromise from '../mongodb';
import { ObjectId } from 'mongodb';

export interface Report {
  _id?: string;
  reportedUsername: string;
  description: string;
  proofImageUrl: string;
  reporterUserId: string;
  reporterUsername: string;
  companyId: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export async function getReportsCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Report>('reports');
}

export async function createReport(report: Omit<Report, '_id' | 'createdAt'>): Promise<Report> {
  const collection = await getReportsCollection();
  const newReport: Omit<Report, '_id'> = {
    ...report,
    createdAt: new Date().toISOString(),
  };
  const result = await collection.insertOne(newReport as any);
  return { ...newReport, _id: result.insertedId.toString() };
}

export async function getReportsByCompany(companyId: string): Promise<Report[]> {
  const collection = await getReportsCollection();
  const reports = await collection.find({ companyId }).sort({ createdAt: -1 }).toArray();
  return reports.map((r) => ({
    ...r,
    _id: r._id?.toString(),
  })) as Report[];
}

export async function getReportById(id: string, companyId: string): Promise<Report | null> {
  const collection = await getReportsCollection();
  try {
    const report = await collection.findOne({
      _id: new ObjectId(id),
      companyId,
    });
    if (!report) return null;
    return { ...report, _id: report._id?.toString() } as Report;
  } catch (error) {
    return null;
  }
}

export async function updateReportStatus(
  id: string,
  companyId: string,
  status: 'approved' | 'denied',
  reviewedBy: string
): Promise<Report | null> {
  const collection = await getReportsCollection();
  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), companyId },
      {
        $set: {
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy,
        },
      },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return { ...result, _id: result._id?.toString() } as Report;
  } catch (error) {
    return null;
  }
}

