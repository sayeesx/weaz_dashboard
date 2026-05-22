'use client';

import { ShieldX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-w-md flex-col items-center text-center px-6"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
          Your account does not have the required permissions to access the WEAZ Admin Dashboard.
          Only authorized administrators can sign in.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
      </motion.div>
    </div>
  );
}
