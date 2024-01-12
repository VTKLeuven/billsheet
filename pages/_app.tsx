import '../styles/globals.css'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { Open_Sans } from 'next/font/google'
import { MantineProvider, createEmotionCache } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import Head from 'next/head'
import NavBar from '../components/NavBar'

const open_sans = Open_Sans({subsets: ['latin']})

export default function App({ Component, pageProps }: any) {
    const [supabase] = useState(() => createBrowserSupabaseClient())
    const customEmotionCache = createEmotionCache({
        key: 'mantine',
        prepend: false
    });

    return (
        <>
            <Head>
                <title>VTK Rekeningenblad</title>
            </Head>
            <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
                <MantineProvider
                    withCSSVariables
                    withGlobalStyles
                    withNormalizeCSS
                    emotionCache={customEmotionCache}
                    theme={{
                        colorScheme: 'light',
                        fontFamily: 'Open Sans, sans serif',
                        primaryShade: { light: 5, dark: 7 },
                        colors: {
                            'vtk-yellow': [
                                "#E4C428",
                                "#E8C721",
                                "#EDCA19",
                                "#F3CD11",
                                "#F9D009",
                                "#FFD400",
                                "#F6CE06",
                                "#EEC80C",
                                "#E6C212",
                                "#DEBD17",
                            ]
                        }
                    }}>
                    <main className={open_sans.className}>
                        <NavBar/>
                        <Notifications />
                        <Component {...pageProps} />
                    </main>
                </MantineProvider>
            </SessionContextProvider>
        </>
    )
}
