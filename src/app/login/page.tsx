/**
 * /login — Acceso a la vista cliente 5 Gatos (Google Sign-In).
 */

import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { labFontVars } from "@/lib/login/fonts";

export const metadata = {
  title: "Entrar — 5 Gatos · Bucaramanga",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/5gatos");

  const { callbackUrl } = await searchParams;
  const target =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/5gatos";
  const oauthConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className={`lab ${labFontVars} flex min-h-screen items-center justify-center px-4`}>
      <div className="w-full max-w-sm rounded-sm border border-lab-rule bg-lab-surface p-8 text-center">
        <span className="lab-frame mx-auto inline-flex bg-lab-surface p-1.5">
          <Image
            src="/assets/logo_gato_dumas.png"
            alt="Gato Dumas"
            width={72}
            height={72}
            className="lab-logo h-14 w-14 object-contain"
            priority
          />
        </span>
        <p className="lab-eyebrow mt-4 text-[10px] tracking-[0.28em] text-lab-muted">
          Instituto Gato Dumas
        </p>
        <h1 className="lab-display mt-1 text-3xl leading-none text-lab-ink-strong">
          Cinco Gatos
        </h1>
        <p className="mt-1 text-sm font-medium text-lab-muted">Bucaramanga</p>
        <p className="mt-3 text-sm text-lab-muted">
          Reporte de pauta digital de Gato Dumas Bucaramanga. Entra con tu
          cuenta de Google autorizada.
        </p>

        {oauthConfigured ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: target });
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-sm border border-lab-rule-strong bg-lab-surface px-4 py-3 text-base font-semibold text-lab-ink transition hover:bg-lab-coconut focus:outline-none focus-visible:ring-1 focus-visible:ring-lab-accent"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Entrar con Google
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-sm border border-lab-rule border-l-[3px] border-l-lab-ambar bg-lab-ambar-soft px-4 py-3 text-left text-sm text-lab-ink">
            El acceso con Google aún no está habilitado. Juan debe configurar
            las credenciales OAuth (ver docs/LOGIN_SETUP.md).
          </div>
        )}

        <p className="lab-mono mt-6 text-[10px] uppercase tracking-wider text-lab-faint">
          ¿No tienes acceso? Escríbele a Juan · juandgarcia1224@gmail.com
        </p>
      </div>
    </div>
  );
}
