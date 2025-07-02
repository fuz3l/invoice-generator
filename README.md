# Invoice Generator - React + Firebase

A complete web application for small business owners to generate professional invoices. Built with React, Firebase, and Tailwind CSS.

## Features

### 🔐 Authentication
- User registration with business information
- Secure login/logout functionality
- Route protection for authenticated users

### 📊 Dashboard
- Modern, responsive dashboard with user information
- Real-time invoice form with live preview
- Auto-calculation of totals and tax (10% GST)
- Professional invoice template

### 📄 Invoice Generation
- Create invoices with customer details and multiple items
- Live preview with modern design
- PDF download functionality using html2pdf.js
- Automatic storage in Firestore database

### 📋 Invoice History
- View all previously generated invoices
- Download past invoices as PDF
- Summary statistics (total invoices, revenue, unique customers)

### 🛡️ Security
- Firebase Authentication for user management
- Firestore security rules for data protection
- Users can only access their own data

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **PDF Generation**: html2pdf.js
- **Routing**: React Router DOM

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd invoice-generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your Firebase configuration

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /invoices/{invoiceId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── InvoiceForm.jsx
│   ├── InvoicePreview.jsx
│   └── Navbar.jsx
├── context/            # React context for state management
│   └── AuthContext.jsx
├── firebase/           # Firebase configuration
│   └── config.js
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── InvoiceHistory.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── routes/             # Route protection
│   └── PrivateRoute.jsx
├── utils/              # Utility functions
│   └── generatePDF.js
├── App.jsx             # Main app component
└── main.jsx           # App entry point
```

## Usage

### Registration
1. Navigate to `/register`
2. Fill in personal and business information
3. Create your account

### Creating Invoices
1. Login to your account
2. Go to the Dashboard
3. Fill in customer information and items
4. Preview the invoice in real-time
5. Download as PDF

### Viewing History
1. Navigate to "Invoice History" from the navbar
2. View all your previous invoices
3. Download any invoice as PDF

## Customization

### Styling
- Modify Tailwind classes in components
- Update color schemes in `tailwind.config.js`
- Customize invoice template in `InvoicePreview.jsx`

### Business Logic
- Update tax calculation in `InvoicePreview.jsx`
- Modify invoice number generation in `generatePDF.js`
- Add new fields to the registration form

### Firebase
- Update security rules for additional security
- Add new Firestore collections as needed
- Implement additional Firebase services

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: Make sure to replace all placeholder values (API keys, project IDs, etc.) with your actual Firebase configuration values before running the application.
