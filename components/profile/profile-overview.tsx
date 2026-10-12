'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/components/app-shell'

const initialProfile = {
  email: '',
  firstName: 'Dominik',
  lastName: 'Züger',
  telephone: '',
  mobile: '',
  fax: '',
}

const fieldClass = 'h-[46px] rounded-xl border-border bg-background px-3.5'

export function ProfileOverview() {
  const { language } = useLanguage()
  const isEnglish = language === 'en'
  const [profile, setProfile] = useState(initialProfile)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [accountMessage, setAccountMessage] = useState('')

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(
      isEnglish
        ? 'Profile changes are not saved permanently in this demo.'
        : 'Profiländerungen werden in dieser Demo nicht dauerhaft gespeichert.',
    )
  }

  function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== passwordConfirmation) {
      setMessage(isEnglish ? 'The passwords do not match.' : 'Die Passwörter stimmen nicht überein.')
      return
    }
    setMessage(
      isEnglish
        ? 'Password changes are not connected to an account server in this demo.'
        : 'Passwortänderungen sind in dieser Demo nicht mit einem Kontoserver verbunden.',
    )
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-primary">{isEnglish ? 'Settings' : 'Einstellungen'}</p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{isEnglish ? 'Profile' : 'Profil'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEnglish ? 'Manage your personal details and account.' : 'Verwalten Sie Ihre persönlichen Daten und Ihr Konto.'}
        </p>
      </div>

      {message && (
        <p role="status" className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_2px_12px_rgba(16,37,66,0.035)] sm:p-7">
          <h2 className="text-base font-semibold">{isEnglish ? 'Profile' : 'Profil'}</h2>
          <div className="my-5 border-t border-border" />
          <form onSubmit={updateProfile} className="flex flex-col gap-5">
            <ProfileField
              id="profile-email"
              label={isEnglish ? 'Email*' : 'E-Mail*'}
              type="email"
              required
              autoComplete="email"
              value={profile.email}
              onChange={(value) => setProfile((current) => ({ ...current, email: value }))}
            />
            <ProfileField
              id="profile-first-name"
              label={isEnglish ? 'First name*' : 'Vorname*'}
              required
              autoComplete="given-name"
              value={profile.firstName}
              onChange={(value) => setProfile((current) => ({ ...current, firstName: value }))}
            />
            <ProfileField
              id="profile-last-name"
              label={isEnglish ? 'Last name*' : 'Nachname*'}
              required
              autoComplete="family-name"
              value={profile.lastName}
              onChange={(value) => setProfile((current) => ({ ...current, lastName: value }))}
            />
            <ProfileField
              id="profile-telephone"
              label={isEnglish ? 'Phone' : 'Tel.-Nr.'}
              type="tel"
              autoComplete="tel"
              value={profile.telephone}
              onChange={(value) => setProfile((current) => ({ ...current, telephone: value }))}
            />
            <ProfileField
              id="profile-mobile"
              label={isEnglish ? 'Mobile phone' : 'Mobil-Nr.'}
              type="tel"
              autoComplete="tel"
              value={profile.mobile}
              onChange={(value) => setProfile((current) => ({ ...current, mobile: value }))}
            />
            <ProfileField
              id="profile-fax"
              label={isEnglish ? 'Fax' : 'Fax'}
              type="tel"
              value={profile.fax}
              onChange={(value) => setProfile((current) => ({ ...current, fax: value }))}
            />
            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" className="h-10 rounded-xl px-6 font-semibold">
                {isEnglish ? 'Save' : 'Speichern'}
              </Button>
            </div>
          </form>
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_2px_12px_rgba(16,37,66,0.035)] sm:p-7">
            <h2 className="text-base font-semibold">{isEnglish ? 'Reset password' : 'Passwort zurücksetzen'}</h2>
            <div className="my-5 border-t border-border" />
            <form onSubmit={resetPassword} className="flex flex-col gap-5">
              <ProfileField
                id="profile-password"
                label={isEnglish ? 'Password*' : 'Passwort*'}
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
              <ProfileField
                id="profile-password-confirm"
                label={isEnglish ? 'Confirm password*' : 'Passwort bestätigen*'}
                type="password"
                required
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
              />
              <div className="flex justify-end border-t border-border pt-5">
                <Button type="submit" className="h-10 rounded-xl px-5 font-semibold">
                  {isEnglish ? 'Set new password' : 'Neues Passwort festlegen'}
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_2px_12px_rgba(16,37,66,0.035)] sm:p-7">
            <h2 className="text-base font-semibold">{isEnglish ? 'Account' : 'Konto'}</h2>
            <div className="my-5 border-t border-border" />
            <div className="flex flex-col items-center gap-5">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl px-5 font-semibold"
                onClick={() =>
                  setAccountMessage(
                    isEnglish
                      ? 'Login history is not available in this demo.'
                      : 'Login-Historie ist in dieser Demo nicht verfügbar.',
                  )
                }
              >
                {isEnglish ? 'View login history' : 'Login-Historie anzeigen'}
              </Button>
              {accountMessage && (
                <p role="status" className="text-center text-sm text-muted-foreground">
                  {accountMessage}
                </p>
              )}
              <div className="w-full border-t border-border" />
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl px-5 font-semibold"
                onClick={() =>
                  setAccountMessage(
                    isEnglish
                      ? 'Terms of use are not available in this demo.'
                      : 'Nutzungsbedingungen sind in dieser Demo nicht hinterlegt.',
                  )
                }
              >
                {isEnglish ? 'Terms of use' : 'Nutzungsbedingungen'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

type ProfileFieldProps = {
  id: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  value: string
  onChange: (value: string) => void
}

function ProfileField({
  id,
  label,
  type = 'text',
  required = false,
  autoComplete,
  value,
  onChange,
}: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="px-1 text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
