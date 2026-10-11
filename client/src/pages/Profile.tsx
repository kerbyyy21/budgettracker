import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Crown } from 'lucide-react';
import { profileApi } from '../api/endpoints';
import { profileSchema, type ProfileForm } from '../schemas/profile';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { applyServerErrors, getErrorMessage } from '../lib/errors';
import type { Profile as ProfileType } from '../types';
import { Badge, PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ErrorState, PageLoader } from '../components/ui/StateViews';

function ProfileEditor({ profile, onSaved }: { profile: ProfileType; onSaved: () => void }) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, email: profile.email },
  });

  const submit = async (values: ProfileForm) => {
    setFormError(null);
    try {
      await profileApi.update(values);
      toast.success('Profile updated');
      onSaved();
    } catch (err) {
      if (!applyServerErrors(err, setError, ['name', 'email'])) setFormError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="card space-y-5 p-5 sm:p-7">
      <h2 className="text-xl font-bold">Your details</h2>
      <Field label="Full name" htmlFor="name" error={errors.name?.message}><input id="name" className={`input ${errors.name ? 'input-error' : ''}`} {...register('name')} /></Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}><input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email')} /></Field>
      {formError && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">{formError}</p>}
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
    </form>
  );
}

export default function Profile() {
  const { data, loading, error, reload } = useFetch(() => profileApi.get(), []);
  if (loading && !data) return <PageLoader label="Loading profile…" />;
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your details and plan." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <ProfileEditor key={`${data.name}-${data.email}`} profile={data} onSaved={reload} />
        <aside className="card h-fit p-5 sm:p-7">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-sun-600"><Crown className="h-6 w-6" /></span><div><p className="text-sm text-ink-muted">Current plan</p><p className="font-display text-xl font-bold">{data.plan}</p></div></div>
          <p className="mt-4 text-sm text-ink-soft">Using {data.subscription.walletsUsed} {data.subscription.walletLimit === null ? 'wallets (unlimited)' : `of ${data.subscription.walletLimit} wallets`}.</p>
          {data.subscription.trialActive && <div className="mt-3"><Badge tone="sun">{data.subscription.trialDaysLeft} trial days left</Badge></div>}
          <Link to="/app/subscription" className="btn btn-soft mt-5 w-full">Manage subscription</Link>
        </aside>
      </div>
    </div>
  );
}
