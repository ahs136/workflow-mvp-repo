'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/utils/supabaseClient';

export default function useRequireAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/');
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Optional: listen for auth changes (sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.replace('/');
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  return { loading };
}
