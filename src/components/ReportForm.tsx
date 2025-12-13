'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';
import Image from 'next/image';

interface ReportFormProps {
  companyId: string;
}

export default function ReportForm({ companyId }: ReportFormProps) {
  const [reportedUsername, setReportedUsername] = useState('');
  const [description, setDescription] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB');
        return;
      }
      setProofImage(file);
      setErrorMessage('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setProofImageUrl(null);
    const fileInput = document.getElementById('proof-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Upload image first if we have a file to upload
      let imageUrl = proofImageUrl;
      if (proofImage) {
        // If we have a file, always upload it to Cloudinary
        // (proofImageUrl might be a data URL preview, or might be empty)
        const formData = new FormData();
        formData.append('file', proofImage);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload image');
        }
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      if (!imageUrl) {
        throw new Error('Please upload proof image');
      }

      // Submit report
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUsername,
          description,
          proofImageUrl: imageUrl,
          companyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      setSubmitStatus('success');
      setReportedUsername('');
      setDescription('');
      setProofImage(null);
      setProofImageUrl(null);
      
      // Reset form file input
      const fileInput = document.getElementById('proof-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Report a Scammer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Help keep our community safe by reporting suspicious activity. All reports are reviewed by our team.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Scammer Username"
              placeholder="@username"
              value={reportedUsername}
              onChange={(e) => setReportedUsername(e.target.value)}
              required
              sx={{ mb: 3 }}
              helperText="Enter the username of the user you want to report"
            />

            <TextField
              fullWidth
              label="What did they do?"
              placeholder="Describe the scam or suspicious activity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={5}
              sx={{ mb: 3 }}
              helperText="Provide details about what happened"
            />

            <Box sx={{ mb: 3 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="proof-image"
                type="file"
                onChange={handleImageChange}
                required
              />
              <label htmlFor="proof-image">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 2 }}
                >
                  Upload Proof Image
                </Button>
              </label>
              {proofImageUrl && (
                <Paper
                  elevation={2}
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    p: 1,
                    mt: 2,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                  <Box
                    sx={{
                      width: 200,
                      height: 200,
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={proofImageUrl}
                      alt="Proof"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Paper>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
              </Typography>
            </Box>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            {submitStatus === 'success' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Report submitted successfully! Our team will review it shortly.
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
