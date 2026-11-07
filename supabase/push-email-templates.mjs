// Uploads the email templates in supabase/templates to the Supabase project, replacing Supabase's
// default sign-up confirmation and password reset emails.
//
//   SUPABASE_ACCESS_TOKEN=<token> node supabase/push-email-templates.mjs
//
// The token is a personal access token from https://supabase.com/dashboard/account/tokens (it isn't
// stored anywhere). The project comes from SUPABASE_URL in server/.env.
// Or paste the files by hand: Supabase dashboard > Authentication > Emails.
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const TEMPLATES = {
  mailer_subjects_confirmation: 'Confirm your DECA Quizzer account',
  mailer_templates_confirmation_content: fs.readFileSync(path.join(here, 'templates/confirm-signup.html'), 'utf8'),
  mailer_subjects_recovery: 'Reset your DECA Quizzer password',
  mailer_templates_recovery_content: fs.readFileSync(path.join(here, 'templates/reset-password.html'), 'utf8'),
};

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN to a personal access token (https://supabase.com/dashboard/account/tokens).');
  process.exit(1);
}

const envFile = fs.readFileSync(path.join(here, '../server/.env'), 'utf8');
const supabaseUrl = envFile.match(/^SUPABASE_URL="?([^"\r\n]+)"?/m)?.[1];
const projectRef = supabaseUrl && new URL(supabaseUrl).hostname.split('.')[0];
if (!projectRef) {
  console.error('Could not find SUPABASE_URL in server/.env');
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(TEMPLATES),
});
if (!response.ok) {
  console.error(`Supabase responded ${response.status}: ${await response.text()}`);
  process.exit(1);
}
console.log(`Email templates updated for project ${projectRef}.`);
