import { useState } from 'react';
import { toast } from 'sonner';
import { Shield, Mail, Phone, Briefcase, Moon, Sun, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api, apiError } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, FieldGroup } from '@/components/ui/Field';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import type { Department } from '@/lib/types';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState({ name: user?.name || '', jobTitle: user?.jobTitle || '', phone: user?.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser({ ...user!, ...data });
      toast.success('Profile updated');
    } catch (err) { toast.error(apiError(err)); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.put('/auth/profile', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(apiError(err)); }
    finally { setSavingPw(false); }
  };

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Manage your account information and preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user?.name} src={user?.avatar} size="lg" className="h-20 w-20 text-2xl" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">{user?.name}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
              <Shield className="h-3.5 w-3.5" /> {user?.role}
            </span>
          </div>
          <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
            <Row icon={<Mail className="h-4 w-4" />} value={user?.email} />
            <Row icon={<Briefcase className="h-4 w-4" />} value={user?.jobTitle || 'No title set'} />
            <Row icon={<Phone className="h-4 w-4" />} value={user?.phone || 'No phone set'} />
            {(user?.department as Department)?.name && <Row icon={<Shield className="h-4 w-4" />} value={(user?.department as Department).name} />}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Personal Information" subtitle="Update your account details." />
            <form onSubmit={saveProfile} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup label="Full name"><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></FieldGroup>
                <FieldGroup label="Job title"><Input value={profile.jobTitle} onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))} /></FieldGroup>
              </div>
              <FieldGroup label="Phone"><Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" /></FieldGroup>
              <div className="flex justify-end"><Button type="submit" loading={savingProfile}>Save changes</Button></div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Appearance" subtitle="Customize how Talent Sphere looks." />
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">{theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</div>
                <div><p className="font-medium text-foreground">Theme</p><p className="text-sm text-muted-foreground capitalize">{theme} mode</p></div>
              </div>
              <Button variant="outline" onClick={toggle}>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Security</span>} subtitle="Change your password." />
            <form onSubmit={savePassword} className="space-y-4 p-5">
              <FieldGroup label="Current password"><Input type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} required /></FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup label="New password"><Input type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} required /></FieldGroup>
                <FieldGroup label="Confirm password"><Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} required /></FieldGroup>
              </div>
              <div className="flex justify-end"><Button type="submit" loading={savingPw}>Update password</Button></div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
}
