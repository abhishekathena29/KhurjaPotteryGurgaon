import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (login(email, password)) {
      navigate('/admin/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brown-dark mb-2">
              Admin Login
            </h1>
            <p className="text-brown-dark/60">Khurja@Gng Admin Panel</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-dark/40"
                  size={20}
                />
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@123"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-dark/40"
                  size={20}
                />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin123"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-brown-dark/60">
            <p>Default credentials:</p>
            <p className="font-mono">Email: admin@123</p>
            <p className="font-mono">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

