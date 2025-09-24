/**
 * UserProfile Component - Example of post-scaffolding development
 * This demonstrates the extended MCP workflow for ongoing project development
 */
interface UserProfileProps {
  name: string
  email: string
  avatar?: string
}

export default function UserProfile({ name, email, avatar }: UserProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-sm mx-auto">
      <div className="flex items-center space-x-4">
        {avatar ? (
          <img 
            src={avatar} 
            alt={`${name}'s avatar`}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-semibold text-lg">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
          View Profile
        </button>
      </div>
    </div>
  )
}
