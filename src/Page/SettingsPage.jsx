import React from 'react'
import RequireAuth from '../components/RequireAuth'
import AccountSection from '../components/settings/AccountSection'
import AppearanceSection from '../components/settings/AppearanceSection'
import LeaveSection from '../components/settings/LeaveSection'
import PrivacySection from '../components/settings/PrivacySection'
import ProfileSection from '../components/settings/ProfileSection'
import { useAuth } from '../context/AuthContext'
import BackHome from '../components/BackHome'

// Settings: profile, account, privacy & AI, appearance, and leaving.
// Opened from the profile button in the navbar.
const Settings = () => {

    const { profile } = useAuth();

    return (
        <div className="bg-canvas text-heading font-body min-h-[calc(100svh-4rem)] pb-44 md:pb-28">
            <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
                <h1 className="font-headline text-[30px] md:text-[34px] font-semibold tracking-[-0.025em]">Settings</h1>
                {profile
                    ? (
                        <>
                            <ProfileSection />
                            <AccountSection />
                            <PrivacySection />
                            <AppearanceSection />
                            <LeaveSection />
                        </>
                    )
                    : <p role="status" className="text-[15px] text-body">Loading your settings…</p>}
                <BackHome />
            </main>
        </div>
    )
}

const SettingsPage = () => (
    <RequireAuth>
        <Settings />
    </RequireAuth>
)

export default SettingsPage
