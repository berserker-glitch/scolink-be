# Payment System Database Migrations

This document outlines the database migrations needed to implement the payment record system.

## Required Tables

### 1. `payments` table
```sql
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('paid', 'partial', 'pending', 'overdue') NOT NULL DEFAULT 'pending',
  payment_date DATETIME NULL,
  due_date DATE NOT NULL,
  method ENUM('cash', 'transfer', 'check', 'other') NULL,
  note TEXT NULL,
  recorded_by CHAR(36) NOT NULL,
  center_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  FOREIGN KEY (center_id) REFERENCES centers(id),
  
  INDEX idx_student_month (student_id, month),
  INDEX idx_status (status),
  INDEX idx_month (month),
  INDEX idx_center (center_id),
  
  UNIQUE KEY unique_student_month (student_id, month)
);
```

### 2. `payment_subjects` table
```sql
CREATE TABLE payment_subjects (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  subject_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  
  INDEX idx_payment (payment_id),
  INDEX idx_subject (subject_id)
);
```

## Prisma Schema Updates

Add these models to your `prisma/schema.prisma`:

```prisma
model Payment {
  id          String   @id @default(uuid()) @db.Char(36)
  studentId   String   @map("student_id") @db.Char(36)
  month       String   @db.VarChar(7)
  amount      Decimal  @db.Decimal(10, 2)
  paidAmount  Decimal? @map("paid_amount") @db.Decimal(10, 2)
  status      PaymentStatus @default(PENDING)
  paymentDate DateTime? @map("payment_date")
  dueDate     DateTime @map("due_date") @db.Date
  method      PaymentMethod?
  note        String?  @db.Text
  recordedBy  String   @map("recorded_by") @db.Char(36)
  centerId    String   @map("center_id") @db.Char(36)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  recordedByUser User  @relation("RecordedPayments", fields: [recordedBy], references: [id])
  center      Center   @relation(fields: [centerId], references: [id])
  subjects    PaymentSubject[]

  @@unique([studentId, month], name: "unique_student_month")
  @@index([studentId, month], name: "idx_student_month")
  @@index([status], name: "idx_status")
  @@index([month], name: "idx_month")
  @@index([centerId], name: "idx_center")
  @@map("payments")
}

model PaymentSubject {
  id        String   @id @default(uuid()) @db.Char(36)
  paymentId String   @map("payment_id") @db.Char(36)
  subjectId String   @map("subject_id") @db.Char(36)
  amount    Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  payment   Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  subject   Subject  @relation(fields: [subjectId], references: [id])

  @@index([paymentId], name: "idx_payment")
  @@index([subjectId], name: "idx_subject")
  @@map("payment_subjects")
}

enum PaymentStatus {
  PAID
  PARTIAL
  PENDING
  OVERDUE

  @@map("payment_status")
}

enum PaymentMethod {
  CASH
  TRANSFER
  CHECK
  OTHER

  @@map("payment_method")
}
```

## Required Updates to Existing Models

### Update `Student` model
```prisma
model Student {
  // ... existing fields ...
  
  // Add relation to payments
  payments    Payment[]
  
  // ... rest of model
}
```

### Update `Subject` model
```prisma
model Subject {
  // ... existing fields ...
  
  // Add relation to payment subjects
  paymentSubjects PaymentSubject[]
  
  // ... rest of model
}
```

### Update `User` model
```prisma
model User {
  // ... existing fields ...
  
  // Add relation to recorded payments
  recordedPayments Payment[] @relation("RecordedPayments")
  
  // ... rest of model
}
```

### Update `Center` model
```prisma
model Center {
  // ... existing fields ...
  
  // Add relation to payments
  payments    Payment[]
  
  // ... rest of model
}
```

## Migration Commands

After updating the Prisma schema, run:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_payment_system

# Or for production
npx prisma migrate deploy
```

## Indexes and Performance

The schema includes several indexes for optimal performance:

- **`idx_student_month`**: Fast lookup of payments by student and month
- **`idx_status`**: Quick filtering by payment status
- **`idx_month`**: Efficient monthly reports and analytics
- **`idx_center`**: Center-scoped queries
- **`unique_student_month`**: Prevents duplicate payments for same month

## Data Validation

Consider adding these constraints at the application level:

- **Month format**: Must be YYYY-MM format
- **Amount validation**: Must be positive
- **Paid amount**: Cannot exceed total amount
- **Due date**: Should be end of the specified month
- **Status logic**: 
  - `paid` when paidAmount >= amount
  - `partial` when 0 < paidAmount < amount
  - `pending` when paidAmount = 0 and not overdue
  - `overdue` when paidAmount < amount and past due date

## Sample Data

After migration, you can seed with sample payment data:

```sql
-- Example payment record
INSERT INTO payments (
  id, student_id, month, amount, paid_amount, status, 
  payment_date, due_date, method, recorded_by, center_id
) VALUES (
  UUID(), 'student-uuid', '2024-01', 500.00, 500.00, 'paid',
  '2024-01-15', '2024-01-31', 'cash', 'admin-uuid', 'center-uuid'
);

-- Example payment subjects
INSERT INTO payment_subjects (id, payment_id, subject_id, amount) VALUES 
(UUID(), 'payment-uuid', 'math-uuid', 300.00),
(UUID(), 'payment-uuid', 'physics-uuid', 200.00);
```

This completes the database schema needed for the payment record system.
