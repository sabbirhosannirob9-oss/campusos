# CampusOS — Fulbariya College

A responsive React + TypeScript + Vite starter for a college website and campus portal. Includes Supabase Auth/data integration, Cloudinary unsigned image upload helper, notices, hero slides, BNCC/Scouts/blood donation cards, responsive navigation and a basic PWA shell.

## 1. Run online
1. Create a StackBlitz Vite React + TypeScript project, or import this repository/archive into a supported online IDE.
2. Install dependencies with `npm install` (or let the IDE install them).
3. Run `npm run dev` and open the preview.
4. For deployment, push the project to GitHub and import the repository in Vercel. Use the Vite framework preset; build command `npm run build`, output directory `dist`.

## 2. Central configuration
Edit `src/config.ts` for college name, logo, colors, address, Supabase URL/key, Cloudinary cloud/preset/folder, enabled modules, fallback counters, departments and navigation.

## 3. Database setup
Open Supabase Dashboard → SQL Editor → New query. Paste and run `supabase/schema.sql` once. The schema creates:
- profiles (role-aware user profile)
- departments
- teachers
- students
- notices
- hero_slides
- site_counters
- routines
- results
- activities (BNCC, Scouts, blood donation, events)
- gallery_items
- attendance
- site_settings

RLS is enabled. Public pages can read published/active public content. Admin write policies require `profiles.role = 'admin'`.

## 4. First administrator
1. Create the first account from Supabase Dashboard → Authentication → Users (do not enable public registration for an admin account).
2. Copy its email and run this in SQL Editor, replacing the email:
   `update public.profiles set role = 'admin' where email = 'YOUR-ADMIN-EMAIL';`
3. Sign in from the app. The admin panel currently supports publishing notices and hero slides. More CRUD forms for students, teachers, BNCC/Scouts, counters, routines, results and gallery can be added using the existing schema.

## 5. Cloudinary
The app uses the provided cloud name and unsigned preset from `src/config.ts`. Confirm `college_unsigned` is configured as **Unsigned**, and its allowed folder settings match your Cloudinary account. Unsigned presets are public-facing; restrict allowed formats/size in Cloudinary. Do not upload private student documents through an unsigned public image preset.

## 6. Important limitations
- Counters currently show configured fallback values; live counter editing UI is not yet included.
- Student/teacher login is wired to Supabase Auth, but role-specific dashboard pages and CRUD management screens are starter features to implement next.
- PWA installation depends on browser support and HTTPS. Service-worker offline support is a basic shell, not offline database synchronization.
- Keep service-role keys out of frontend files. The supplied publishable key is intended for client-side use only with correct RLS policies.
- Verify all institutional figures and content before publishing. Sample notice cards are shown if the database has no published notices.
