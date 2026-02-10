

## Fix: Selfie images not displaying in admin verification

### Problem
The selfie images are not loading because:
1. The `selfies` storage bucket is **private** (correct for security)
2. But the URL saved in the database uses the **public** URL format (`/storage/v1/object/public/selfies/...`), which doesn't work for private buckets
3. The admin panel tries to use this URL directly since it starts with `http`, but the URL returns nothing because the bucket is private

### Solution

**Two changes needed:**

#### 1. Fix the upload code in `FacialVerificationCamera.tsx` (or `IdentityVerificationTab.tsx`)
- Instead of saving the full public URL in `selfie_url`, save only the **relative storage path** (e.g., `user_id/selfie-0.jpg`)
- This way the admin panel can generate a proper **signed URL** to access the private file

#### 2. Fix the display code in `AdminVerificationTab.tsx`
- Update the `SelfiePreview` component to always generate a signed URL from the relative path
- Remove the `startsWith("http")` shortcut since all paths should now be relative
- If a full URL is still found (for existing data), extract the relative path from it and generate a signed URL

### Technical Details

**In the upload logic** — change from:
```typescript
const { data } = supabase.storage.from("selfies").getPublicUrl(filePath);
profileUpdate.selfie_url = data.publicUrl;
```
To:
```typescript
profileUpdate.selfie_url = filePath; // just the path, e.g. "user_id/selfie-0.jpg"
```

**In `AdminVerificationTab.tsx` SelfiePreview** — always use signed URLs:
```typescript
// If it's a full URL from old data, extract the path
let path = selfiePath;
if (path.startsWith("http")) {
  const match = path.match(/selfies\/(.+)$/);
  if (match) path = match[1];
}
const { data } = await supabase.storage
  .from("selfies")
  .createSignedUrl(path, 3600);
```

**Also fix existing data** — update the database entry for the current user so the already-stored URL is corrected to a relative path.
