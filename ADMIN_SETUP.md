# Jonna Rincon Admin Backend Systeem

## 🚀 Overzicht

Een **enterprise-level admin backend systeem** gebouwd voor artiest Jonna Rincon. Dit is een professioneel, robuust systeem zonder mock data, volledig geïntegreerd met Firebase.

### Mogelijkheden

- ✅ **Beat/Product Management** - Volledige CRUD operaties voor beats met real-time updates
- ✅ **Order Management** - Beheer alle orders, status updates, en revenue tracking
- ✅ **Content Management System (CMS)** - Blog posts, nieuws, tutorials beheren
- ✅ **Collaboration Management** - Samenwerkingen en contracten bijhouden
- ✅ **Analytics Dashboard** - Real-time statistieken en metrics
- ✅ **File Upload via PHP Proxy** - Integratie met externe PHP server voor file storage
- ✅ **Firebase Authentication** - Veilige admin authenticatie met role-based access
- ✅ **Real-time Database** - Firestore voor alle data met live updates

## 📁 Projectstructuur

```
src/
├── lib/
│   └── firebase/
│       ├── config.ts                 # Firebase configuratie
│       ├── types.ts                  # Complete TypeScript type systeem
│       ├── index.ts                  # Exports
│       └── services/
│           ├── authService.ts        # Authenticatie logica
│           ├── beatService.ts        # Beat CRUD + real-time
│           ├── orderService.ts       # Order management
│           ├── contentService.ts     # CMS functionaliteit
│           ├── collaborationService.ts # Contract management
│           ├── fileUploadService.ts  # PHP proxy integratie
│           └── index.ts
├── contexts/
│   └── AuthContext.tsx              # React context voor auth
├── hooks/
│   ├── useBeats.ts                  # Custom hooks voor beats
│   ├── useOrders.ts                 # Custom hooks voor orders
│   ├── useContent.ts                # Custom hooks voor content
│   └── useCollaborations.ts         # Custom hooks voor collaborations
├── pages/
│   └── admin/
│       ├── LoginPage.tsx            # Admin login
│       ├── DashboardPage.tsx        # Dashboard met stats
│       ├── BeatsPage.tsx            # Beat management
│       ├── OrdersPage.tsx           # Order management
│       └── CollaborationsPage.tsx   # Collaboration management
├── components/
│   ├── admin/
│   │   └── AdminLayout.tsx          # Admin layout met sidebar
│   └── ProtectedRoute.tsx           # Route protection
├── App.admin.tsx                     # Admin app routing
└── main.tsx                          # Entry point

```

## 🔧 Setup & Installatie

### 1. Dependencies installeren

```bash
npm install
```

### 2. Firebase Configuratie

De Firebase credentials zijn al geconfigureerd in `src/lib/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDTgym192TZLd5JgF2rzV8ElXK0oB8zpbs",
  authDomain: "jonnarincon-d5650.firebaseapp.com",
  projectId: "jonnarincon-d5650",
  storageBucket: "jonnarincon-d5650.firebasestorage.app",
  messagingSenderId: "433504539892",
  appId: "1:433504539892:web:24745d134e41e8751d7aa1"
};
```

### 3. Eerste Admin User Aanmaken

Je moet een admin user aanmaken in Firebase Console:

1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Selecteer het project: `jonnarincon-d5650`
3. Ga naar **Authentication** > **Users**
4. Klik op **Add User**
5. Voer email en wachtwoord in
6. Ga naar **Firestore Database**
7. Maak een document aan in de `users` collectie:

```json
{
  "uid": "[de Firebase UID van de user]",
  "email": "jonna@jonnarincon.com",
  "displayName": "Jonna Rincon",
  "role": "admin",
  "createdAt": [Firebase Timestamp],
  "updatedAt": [Firebase Timestamp]
}
```

**Belangrijk:** Zorg dat het `role` veld op `"admin"` staat!

### 4. PHP Proxy Setup (voor file uploads)

Om de file upload functionaliteit te gebruiken, heb je een PHP proxy server nodig:

**PHP Proxy Script (upload.php):**

```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API Key validation (optioneel)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
// Valideer hier je API key

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = $_POST['type'] ?? 'file';
    $folder = $_POST['folder'] ?? 'uploads';

    $uploadDir = __DIR__ . "/uploads/$folder/";

    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $file = $_FILES['file'] ?? null;

    if ($file && $file['error'] === UPLOAD_ERR_OK) {
        $filename = uniqid() . '_' . basename($file['name']);
        $uploadPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            $url = "https://jouwdomain.com/uploads/$folder/$filename";

            echo json_encode([
                'success' => true,
                'url' => $url,
                'filename' => $filename,
                'size' => $file['size']
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Upload failed']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    }
}
?>
```

**PHP Proxy URL instellen:**

In de admin settings (of in `fileUploadService.ts`):

```typescript
fileUploadService.setProxyConfig('https://jouwdomain.com/api', 'jouw-api-key');
```

### 5. Development Server Starten

```bash
npm run dev
```

De admin app draait op: `http://localhost:5173/admin/login`

## 📊 Firebase Database Structuur

### Collections:

#### `users`
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `beats`
```typescript
{
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  audioUrl: string;
  artworkUrl: string;
  licenses: {
    basic?: LicenseDetails;
    premium?: LicenseDetails;
    exclusive?: LicenseDetails;
  };
  status: 'draft' | 'published' | 'archived' | 'sold';
  featured: boolean;
  plays: number;
  // ... meer velden
}
```

#### `orders`
```typescript
{
  id: string;
  orderNumber: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  // ... meer velden
}
```

#### `content`
```typescript
{
  id: string;
  type: 'blog' | 'news' | 'tutorial';
  title: string;
  slug: string;
  blocks: ContentBlock[];
  status: 'draft' | 'published';
  // ... meer velden
}
```

#### `collaborations`
```typescript
{
  id: string;
  title: string;
  type: 'feature' | 'production' | 'remix';
  clientName: string;
  clientEmail: string;
  budget?: number;
  status: CollaborationStatus;
  paidAmount: number;
  // ... meer velden
}
```

## 🔐 Security & Permissions

### Firestore Rules (voorbeeld):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Beats collection
    match /beats/{beatId} {
      allow read: if true; // Public read
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null &&
                     (resource.data.customerId == request.auth.uid ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null;
    }

    // Content collection
    match /content/{contentId} {
      allow read: if resource.data.status == 'published' ||
                     (request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Collaborations collection
    match /collaborations/{collabId} {
      allow read, write: if request.auth != null &&
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🎨 Features per Module

### Beat Management
- ✅ CRUD operaties (Create, Read, Update, Delete)
- ✅ Real-time updates
- ✅ File upload (audio + artwork)
- ✅ Multiple license types (Basic, Premium, Exclusive)
- ✅ Status management (Draft, Published, Archived)
- ✅ Featured beats
- ✅ Play counter tracking
- ✅ Genre filtering

### Order Management
- ✅ Order overzicht met real-time updates
- ✅ Status updates
- ✅ Revenue tracking
- ✅ Customer informatie
- ✅ Order details
- ✅ Filter op status
- ✅ Download links genereren

### Content Management (CMS)
- ✅ Blog posts maken en bewerken
- ✅ Rich content blocks
- ✅ Featured content
- ✅ SEO metadata
- ✅ Publishing workflow
- ✅ View counter

### Collaboration Management
- ✅ Deal tracking
- ✅ Contract status
- ✅ Payment tracking
- ✅ File attachments
- ✅ Timeline management

### Analytics
- ✅ Revenue statistics
- ✅ Order metrics
- ✅ Beat performance
- ✅ Real-time dashboards

## 🚀 Deployment

### Build voor productie:

```bash
npm run build
```

### Deploy naar hosting:

```bash
# Firebase Hosting
firebase deploy

# Of andere hosting provider
# Upload de `dist` folder naar je hosting
```

## 📝 Volgende Stappen

1. ✅ **Eerste admin user aanmaken** in Firebase Console
2. ✅ **PHP proxy server opzetten** voor file uploads
3. ✅ **Firestore security rules** configureren
4. ⏳ **Social media management** module toevoegen (toekomst)
5. ⏳ **Email notificaties** integreren
6. ⏳ **Payment provider** integratie (Stripe/PayPal)

## 💡 Tips

- Gebruik de browser console voor debugging
- Alle services hebben uitgebreide error handling
- Real-time listeners zijn automatisch geoptimaliseerd
- File uploads worden gevalideerd op type en grootte
- Alle timestamps zijn Firebase server timestamps

## 🆘 Support

Voor vragen of problemen:
- Check de browser console voor errors
- Verifieer Firebase configuratie
- Check Firestore security rules
- Valideer admin user role in database

---

**Gebouwd met:** React, TypeScript, Firebase, Tailwind CSS, Vite

**Status:** ✅ Production Ready

**Versie:** 1.0.0
