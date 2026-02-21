<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 Not Found - Bagus Dinamika Nusantara</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap"
        rel="stylesheet">

    <style>
        :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --bg-dark: #0f172a;
            --text-light: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-dark);
            /* Grid Pattern Background */
            background-image:
                radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 1) 0, transparent 50%),
                radial-gradient(at 50% 0%, hsla(225, 39%, 30%, 1) 0, transparent 50%),
                radial-gradient(at 100% 0%, hsla(339, 49%, 30%, 1) 0, transparent 50%);
            background-size: cover;
            background-attachment: fixed;
            overflow: hidden;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: var(--text-light);
            position: relative;
            text-align: center;
            /* Center all text by default */
        }

        /* Subtle Grid Overlay for Tech feel */
        body::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: -1;
            mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
        }

        /* Floating Orbs - More subtle now */
        .orb {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
            filter: blur(40px);
            animation: float 6s ease-in-out infinite;
        }

        .orb-1 {
            width: 200px;
            height: 200px;
            top: 20%;
            left: 10%;
            animation-delay: 0s;
        }

        .orb-2 {
            width: 300px;
            height: 300px;
            top: 60%;
            right: 10%;
            animation-delay: 2s;
        }

        @keyframes float {

            0%,
            100% {
                transform: translateY(0px) rotate(0deg);
            }

            50% {
                transform: translateY(-20px) rotate(180deg);
            }
        }

        @keyframes slideUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Container - Full center alignment */
        .container {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            padding: 3rem 2.5rem;
            max-width: 500px;
            width: 90vw;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 60vh;
            border: 1px solid rgba(59, 130, 246, 0.2);
            animation: slideUp 0.8s ease-out;
            opacity: 1;
            transform: none;
        }

        /* Ensure all text elements are centered */
        h1,
        h2,
        p,
        .error-message,
        .footer,
        a,
        .button,
        .icon-lock {
            text-align: center !important;
        }

        /* Logo Area */
        .logo-wrapper {
            margin-bottom: 2rem;
        }

        .logo {
            height: 60px;
            width: auto;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }

        /* Lock Icon Animation */
        .icon-lock {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f61a, #3b82f633);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
            color: #60a5fa;
        }

        .icon-lock svg {
            width: 36px;
            height: 36px;
            stroke-width: 2;
        }

        /* Typography */
        h1 {
            font-size: 4rem;
            line-height: 1;
            font-weight: 800;
            margin-bottom: 0.5rem;
            letter-spacing: -0.03em;
            background: linear-gradient(to bottom right, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-light);
            margin-bottom: 1rem;
        }

        .error-message {
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--text-muted);
            margin-bottom: 2.5rem;
        }

        /* Modern Button */
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.9rem 2rem;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: var(--text-light);
            font-weight: 600;
            text-decoration: none;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            border: 1px solid rgba(59, 130, 246, 0.5);
            box-shadow: 0 10px 24px -6px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
            position: relative;
            overflow: hidden;
        }

        .button svg {
            stroke: currentColor;
        }

        .button::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 70%);
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 30px -8px rgba(37, 99, 235, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.07);
        }

        .button:hover::after {
            opacity: 1;
        }

        .button:active {
            transform: translateY(0);
            box-shadow: 0 8px 18px -6px rgba(37, 99, 235, 0.5);
        }

        .button:focus-visible {
            outline: 2px solid #93c5fd;
            outline-offset: 3px;
        }

        /* Footer - Centered */
        .footer {
            width: 100%;
            position: static;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.2);
            text-align: center;
        }

        /* Bottom Logo - Centered */
        .bottom-logo {
            padding: 1rem 0;
            transition: 0.3s;
            display: flex;
            justify-content: center;
        }

        .bottom-logo img {
            height: 4rem !important;
        }

        @media (max-width: 640px) {
            .container {
                padding: 2rem 1.5rem;
                width: 90%;
            }

            h1 {
                font-size: 3rem;
            }

            .orb {
                opacity: 0.2;
            }

            .footer {
                font-size: 0.75rem;
            }
        }
    </style>
</head>

<body>

    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>

    <div class="container">
        <div class="icon-lock">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
        </div>

        <h1>404</h1>
        <h2>HALAMAN TIDAK DITEMUKAN</h2>

        <p class="error-message">
            {{ $exception->getMessage() ?: 'Maaf, halaman yang Anda cari tidak ditemukan. Mungkin telah dihapus atau alamat URL salah.' }}
        </p>

        <a href="javascript:history.back()" class="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
            </svg>
            Kembali
        </a>

        <div class="bottom-logo">
            <a href="https://wa.me/628600190898?text=Saya mendapatkan error 404. URL: {{ request()->url() }} Message: {{ $exception->getMessage() }}"
                target="_blank" class="button"
                style="margin-left: 1rem; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); box-shadow: 0 10px 24px -6px rgba(249, 115, 22, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z">
                    </path>
                </svg>
                Hubungi Admin
            </a>
            {{-- <img src="{{ asset('images/splash.png') }}" alt="Bagus Dinamika Nusantara" /> --}}
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} Bagus Dinamika Nusantara. All rights reserved.
        </div>
    </div>


</body>

</html>
