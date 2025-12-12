'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { Report, AdminPanelSettings, History } from '@mui/icons-material';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useAccess, setExperienceId } from '@/components/AccessProvider';
import ReportForm from '@/components/ReportForm';
import AdminReviewPage from '@/components/AdminReviewPage';
import MyReports from '@/components/MyReports';

function HomeContent() {
  const searchParams = useSearchParams();
  const experienceId = searchParams?.get('experience') || null;
  const { isAuthorized, loading, role, companyId } = useAccess();
  const [tabValue, setTabValue] = useState(0);
  const { theme, setTheme } = useTheme();

  // Set experienceId in AccessProvider when it's available from page.tsx
  useEffect(() => {
    if (experienceId) {
      setExperienceId(experienceId);
    }
  }, [experienceId]);

  // Use companyId from auth or query params
  const finalCompanyId = companyId;

  if (loading) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" color="error">
            Unauthorized
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            You must be authenticated to use this app.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!finalCompanyId) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" color="error">
            Missing company_id
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Please provide a company_id in the URL query parameters or ensure you're accessing through a Whop experience.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Image
              src={theme === 'dark' ? '/whop-assets/logos/whop-logo-white.png' : '/whop-assets/logos/whop-logo.png'}
              alt="Whop Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Whop Bounty
            </Typography>
          </Box>
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="outlined"
            size="small"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<Report />} iconPosition="start" label="Report Scammer" />
            <Tab icon={<History />} iconPosition="start" label="My Reports" />
            {(role === 'owner' || role === 'admin') && (
              <Tab icon={<AdminPanelSettings />} iconPosition="start" label="Review Reports" />
            )}
          </Tabs>
        </Box>

        {tabValue === 0 && <ReportForm companyId={finalCompanyId} />}
        {tabValue === 1 && <MyReports companyId={finalCompanyId} />}
        {tabValue === 2 && (role === 'owner' || role === 'admin') && (
          <AdminReviewPage companyId={finalCompanyId} />
        )}
      </Container>
    </Box>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          Loading...
        </Typography>
      </Container>
    }>
      <HomeContent />
    </Suspense>
  );
}
