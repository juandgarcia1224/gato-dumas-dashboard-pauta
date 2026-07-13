/**
 * /login-denegado — la cuenta entró con Google pero no está en la allowlist.
 */

import Image from "next/image";
import Link from "next/link";
import { labFontVars } from "@/lib/fivegatos/fonts";

export const metadata = {
  title: "Acceso pendiente — 5 Gatos · Bucaramanga",
};

export default function LoginDenegadoPage() {
  return (
    <div className={`lab ${labFontVars} flex min-h-screen items-center justify-center px-4`}>
      <div className="w-full max-w-md rounded-sm border border-lab-rule bg-lab-surface p-8 text-center">
        <span className="lab-frame mx-auto inline-flex bg-lab-surface p-1.5">
          <Image
            src="/assets/logo_gato_dumas.png"
            alt="Gato Dumas"
            width={72}
            height={72}
            className="lab-logo h-14 w-14 object-contain"
          />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-lab-ink-strong">
          Tu cuenta aún no tiene acceso
        </h1>
        <p className="mt-3 text-base text-lab-muted">
          Este reporte es privado para el equipo de 5 Gatos. Tu cuenta de
          Google todavía no está en la lista de acceso.
        </p>
        <div className="mt-5 rounded-sm bg-lab-coconut px-4 py-3 text-sm text-lab-ink">
          <p className="font-semibold text-lab-ink-strong">
            ¿Cómo obtener acceso?
          </p>
          <p className="mt-1">
            Solicita acceso a Juan escribiendo a{" "}
            <a
              href="mailto:juandgarcia1224@gmail.com"
              className="font-semibold text-lab-teal underline underline-offset-2 hover:text-lab-accent"
            >
              juandgarcia1224@gmail.com
            </a>{" "}
            indicando el correo de Google con el que quieres entrar.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-sm border border-lab-rule-strong px-4 py-2.5 text-sm font-semibold text-lab-ink transition hover:bg-lab-coconut"
        >
          Intentar con otra cuenta
        </Link>
      </div>
    </div>
  );
}
