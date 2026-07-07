/**
 * /login-denegado — la cuenta entró con Google pero no está en la allowlist.
 */

import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Acceso pendiente — 5 Gatos · Bucaramanga",
};

export default function LoginDenegadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f4f0] px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <Image
          src="/assets/logo_gato_dumas.png"
          alt="Gato Dumas"
          width={72}
          height={72}
          className="mx-auto h-16 w-16 rounded-full object-contain"
        />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-900">
          Tu cuenta aún no tiene acceso
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Este reporte es privado para el equipo de 5 Gatos. Tu cuenta de
          Google todavía no está en la lista de acceso.
        </p>
        <div className="mt-5 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-semibold">¿Cómo obtener acceso?</p>
          <p className="mt-1">
            Solicita acceso a Juan escribiendo a{" "}
            <a
              href="mailto:juandgarcia1224@gmail.com"
              className="font-semibold text-[#B8232A] underline underline-offset-2"
            >
              juandgarcia1224@gmail.com
            </a>{" "}
            indicando el correo de Google con el que quieres entrar.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Intentar con otra cuenta
        </Link>
      </div>
    </div>
  );
}
