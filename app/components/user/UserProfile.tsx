/**
 * UserProfile Component - Example of post-scaffolding development
 * This demonstrates the extended MCP workflow for ongoing project development
 */
import Image from 'next/image'
import { UserProfileProps } from '@/types'

export default function UserProfile({ name, email, avatar }: UserProfileProps) {
  // Don't render anything if no name is provided
  if (!name || name.trim() === '') {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      {avatar ? (
        <Image
          src={avatar}
          alt={`${name}'s avatar`}
          width={32}
          height={32}
          className="w-8 h-8 object-cover rounded-full"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="hidden sm:block">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        {email && <p className="text-xs text-slate-500">{email}</p>}
      </div>
    </div>
  )
}
