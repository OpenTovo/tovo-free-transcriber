import { Mail } from 'lucide-react'
import { GithubIcon, XIcon } from './brand-icons'
import { SoundToggle } from './sound-toggle'

const socialLinks = [
  {
    href: 'mailto:support@tovo.dev',
    label: 'Email',
    external: false,
    icon: <Mail className='h-4 w-4' />,
  },
  {
    href: 'https://x.com/qiweiiiy',
    label: 'X',
    external: true,
    icon: <XIcon className='h-3.5 w-3.5' />,
  },
  {
    href: 'https://github.com/OpenTovo/tovo-free-transcriber',
    label: 'GitHub',
    external: true,
    icon: <GithubIcon className='h-4 w-4' />,
  },
]

export default function Footer() {
  return (
    <footer className='border-t border-border'>
      <div className='mx-auto flex h-14 w-full max-w-6xl items-center justify-center md:justify-between px-4 sm:px-8'>
        <div className='flex items-center gap-1'>
          {socialLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={link.label}
              className='text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer'
            >
              {link.icon}
            </a>
          ))}
          <SoundToggle />
        </div>

        <div className='hidden md:flex items-center gap-4 text-muted-foreground'>
          <span className='text-xs'>Multilingual</span>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <span className='text-xs'>No sign-up required</span>
          <span className='text-xs text-muted-foreground/50'>·</span>
          <span className='text-xs'>100% Local Processing</span>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
