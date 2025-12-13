'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import { Report } from '@/lib/models/Report';
import UserInfoModal from '@/components/UserInfoModal';

interface AdminReviewPageProps {
  companyId: string;
}

export default function AdminReviewPage({ companyId }: AdminReviewPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, [companyId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reports?company_id=${companyId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view reports. Team members only.');
        } else {
          setError('Failed to fetch reports');
        }
        return;
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (report: Report) => {
    setProcessing(report._id || '');
    try {
      const response = await fetch(`/api/reports/${report._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve report');
      }

      await fetchReports();
      setDialogOpen(false);
      setSelectedReport(null);
    } catch (err: any) {
      setError(err.message || 'Failed to approve report');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (report: Report) => {
    setProcessing(report._id || '');
    try {
      const response = await fetch(`/api/reports/${report._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deny',
          companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deny report');
      }

      await fetchReports();
      setDialogOpen(false);
      setSelectedReport(null);
    } catch (err: any) {
      setError(err.message || 'Failed to deny report');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'default';
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const reviewedReports = reports.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 800, mx: 'auto' }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        Review Reports
      </Typography>

      {pendingReports.length === 0 && reviewedReports.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No reports found
            </Typography>
          </CardContent>
        </Card>
      )}

      {pendingReports.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Pending Review ({pendingReports.length})
          </Typography>
          <Grid container spacing={3}>
            {pendingReports.map((report) => (
              <Box sx={{ xs: 12, md: 6 }} key={report._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                        }}
                        onClick={() => {
                          setSelectedUsername(report.reportedUsername);
                          setUserModalOpen(true);
                        }}
                      >
                        {report.reportedUsername}
                      </Typography>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Reported by:{' '}
                      <Typography
                        component="span"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                        }}
                        onClick={() => {
                          setSelectedUsername(report.reporterUsername);
                          setUserModalOpen(true);
                        }}
                      >
                        {report.reporterUsername}
                      </Typography>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {report.description}
                    </Typography>
                    {report.proofImageUrl && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={report.proofImageUrl}
                          alt="Proof"
                          style={{
                            width: '100%',
                            maxHeight: 200,
                            objectFit: 'cover',
                            borderRadius: 8,
                          }}
                        />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          setSelectedReport(report);
                          setDialogOpen(true);
                        }}
                        fullWidth
                      >
                        Approve & Ban
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleDeny(report)}
                        disabled={processing === report._id}
                        fullWidth
                      >
                        Deny
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {new Date(report.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Grid>
        </Box>
      )}

      {reviewedReports.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Reviewed ({reviewedReports.length})
          </Typography>
          <Grid container spacing={3}>
            {reviewedReports.map((report) => (
              <Box sx={{ xs: 12, md: 6 }} key={report._id}>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                        }}
                        onClick={() => {
                          setSelectedUsername(report.reportedUsername);
                          setUserModalOpen(true);
                        }}
                      >
                        {report.reportedUsername}
                      </Typography>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Reported by:{' '}
                      <Typography
                        component="span"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                        }}
                        onClick={() => {
                          setSelectedUsername(report.reporterUsername);
                          setUserModalOpen(true);
                        }}
                      >
                        {report.reporterUsername}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reviewed: {report.reviewedAt ? new Date(report.reviewedAt).toLocaleString() : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Ban</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this report and ban {selectedReport?.reportedUsername}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => selectedReport && handleApprove(selectedReport)}
            disabled={processing === selectedReport?._id}
          >
            {processing === selectedReport?._id ? <CircularProgress size={20} /> : 'Confirm Ban'}
          </Button>
        </DialogActions>
      </Dialog>

      <UserInfoModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        username={selectedUsername}
      />
    </Box>
  );
}

