'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { Report } from '@/lib/models/Report';
import { useAccess } from '@/components/AccessProvider';
import UserInfoModal from '@/components/UserInfoModal';

interface MyReportsProps {
  companyId: string;
}

export default function MyReports({ companyId }: MyReportsProps) {
  const { userId } = useAccess();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  useEffect(() => {
    if (userId && companyId) {
      fetchMyReports();
    }
  }, [userId, companyId]);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reports/my?company_id=${companyId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('You must be authenticated to view your reports.');
        } else {
          setError('Failed to fetch your reports');
        }
        return;
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Approved"
            color="success"
            size="small"
          />
        );
      case 'denied':
        return (
          <Chip
            icon={<Cancel />}
            label="Denied"
            color="error"
            size="small"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<HourglassEmpty />}
            label="Pending"
            color="warning"
            size="small"
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="info">
          You haven't submitted any reports yet. Use the "Report Scammer" tab to submit your first report.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        My Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        View the status of reports you've submitted
      </Typography>

      <Grid container spacing={2}>
        {reports.map((report) => (
          <Grid size={{ xs: 12, md: 6 }} key={report._id}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 0.5,
                        cursor: 'pointer',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                      }}
                      onClick={() => {
                        setSelectedUsername(report.reportedUsername);
                        setUserModalOpen(true);
                      }}
                    >
                      Reported: {report.reportedUsername}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted: {formatDate(report.createdAt)}
                    </Typography>
                  </Box>
                  {getStatusChip(report.status)}
                </Box>

                <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
                  {report.description}
                </Typography>

                {report.proofImageUrl && (
                  <Box
                    sx={{
                      mb: 1.5,
                      borderRadius: 1,
                      overflow: 'hidden',
                      maxWidth: '100%',
                    }}
                  >
                    <img
                      src={report.proofImageUrl}
                      alt="Proof"
                      style={{
                        width: '100%',
                        maxHeight: 150,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}

                {report.reviewedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Reviewed: {formatDate(report.reviewedAt)}
                    {report.reviewedBy && ` by ${report.reviewedBy}`}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <UserInfoModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        username={selectedUsername}
      />
    </Box>
  );
}

