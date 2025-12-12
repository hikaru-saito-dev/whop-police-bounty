import getClientPromise from '../mongodb';
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

// MongoDB document type (with ObjectId)
interface ReportDocument extends Omit<Report, '_id'> {
  _id?: ObjectId;
}

export async function getReportsCollection() {
  const clientPromise = getClientPromise();
  const client = await clientPromise;
  const db = client.db();
  return db.collection<ReportDocument>('reports');
}

export async function createReport(report: Omit<Report, '_id' | 'createdAt'>): Promise<Report> {
  const collection = await getReportsCollection();
  const newReport: Omit<ReportDocument, '_id'> = {
    ...report,
    createdAt: new Date().toISOString(),
  };
  const result = await collection.insertOne(newReport);
  return { ...report, _id: result.insertedId.toString(), createdAt: newReport.createdAt };
}

export async function getReportsByCompany(companyId: string): Promise<Report[]> {
  const collection = await getReportsCollection();
  const reports = await collection.find({ companyId }).sort({ createdAt: -1 }).toArray();
  return reports.map((r) => ({
    ...r,
    _id: r._id?.toString(),
  })) as Report[];
}

export async function getReportsByReporter(
  reporterUserId: string,
  companyId: string
): Promise<Report[]> {
  const collection = await getReportsCollection();
  const reports = await collection
    .find({ reporterUserId, companyId })
    .sort({ createdAt: -1 })
    .toArray();
  return reports.map((r) => ({
    ...r,
    _id: r._id?.toString(),
  })) as Report[];
}

export async function getReportById(id: string, companyId: string): Promise<Report | null> {
  const collection = await getReportsCollection();
  try {
    const objectId = new ObjectId(id);
    const report = await collection.findOne({
      _id: objectId,
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
    const objectId = new ObjectId(id);
    const result = await collection.findOneAndUpdate(
      { _id: objectId, companyId },
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

