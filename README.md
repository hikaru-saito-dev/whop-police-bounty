# Whop Bounty - Scammer Reporting App

A Next.js application for reporting scammers on the Whop platform. Built with Material-UI, MongoDB, and the Whop SDK.

## Features

- **Report Submission**: Users can report scammers with username, description, and proof images
- **Admin Review Panel**: Team members can review reports and approve/deny them
- **User Banning**: Approved reports automatically ban the reported user from the company
- **Light/Dark Mode**: Theme switching aligned with Whop's design
- **MongoDB Integration**: Persistent storage for all reports

## Prerequisites

- Node.js 20+ 
- MongoDB (local or Atlas)
- Whop API Key and App ID
- Cloudinary account (for image uploads)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   WHOP_API_KEY=your_whop_api_key_here
   NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
   MONGODB_URI=mongodb://localhost:27017/whop-bounty
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
   
   **Getting Cloudinary credentials:**
   1. Sign up at [cloudinary.com](https://cloudinary.com)
   2. Go to your Dashboard
   3. Copy your Cloud Name, API Key, and API Secret

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   Open [http://localhost:3000?company_id=YOUR_COMPANY_ID](http://localhost:3000?company_id=YOUR_COMPANY_ID)

## Usage

### For Regular Users

1. Navigate to the app with your company_id in the URL
2. Fill out the report form:
   - Enter the scammer's username
   - Describe what they did
   - Upload proof images
3. Submit the report

### For Team Members

1. Navigate to the "Review Reports" tab
2. View pending reports
3. Approve reports to ban the user, or deny if the report is invalid
4. View reviewed reports history

## API Routes

- `POST /api/reports` - Submit a new report
- `GET /api/reports?company_id=xxx` - Get all reports (team members only)
- `PATCH /api/reports/[id]` - Approve or deny a report (team members only)
- `POST /api/upload` - Upload proof images to Cloudinary

## Technologies

- **Next.js 16** - React framework
- **Material-UI (MUI)** - UI components
- **MongoDB** - Database
- **@whop/sdk** - Whop API integration
- **next-themes** - Theme management

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHOP_API_KEY` | Your Whop API key | Yes |
| `NEXT_PUBLIC_WHOP_APP_ID` | Your Whop App ID (for user token verification) | Optional |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Yes |

## License

MIT
