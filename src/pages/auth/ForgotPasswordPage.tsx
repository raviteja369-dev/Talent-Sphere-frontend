import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.resetUrl) setResetUrl(data.resetUrl);
      toast.success('Reset instructions generated');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        {sent ? (
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <MailCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="font-display text-xl font-bold">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, you'll receive a password reset link shortly.
            </p>
            {resetUrl && (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-left">
                <p className="text-xs font-medium text-muted-foreground">Demo reset link:</p>
                <Link to={resetUrl.replace(/^.*\/reset-password/, '/reset-password')} className="break-all text-xs text-primary hover:underline">
                  {resetUrl}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold text-foreground">Reset your password</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" loading={loading} size="lg" className="w-full">Send reset link</Button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
