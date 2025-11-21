import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, CheckCircle, Package2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const REMEMBER_ME_KEY = "bmr_remember_email";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const location = useLocation();
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate]);

  // Carregar email salvo ao iniciar
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Salvar ou remover email do localStorage
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
    
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white space-y-8 hidden lg:block"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center">
              <Package2 className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">IT Manager</h1>
              <p className="text-orange-400 text-sm font-medium">gestão inteligente de TI</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-3xl font-bold leading-tight">
              Transforme sua TI em
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                {" "}
                Centro de Excelência
              </span>
            </h3>
            <p className="text-white/70 text-lg">
              Acesse nossa plataforma completa e comece a ver resultados desde o primeiro dia
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            {[
              "Gestão completa de ativos",
              "Controle de manutenção",
              "Relatórios em tempo real",
              "Segurança enterprise",
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * index }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-orange-500" />
                <span className="text-white/80">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login/Signup Form */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <Card className="bg-white/95 backdrop-blur-lg p-8 sm:p-10 rounded-3xl shadow-2xl border-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">{isSignUp ? "Criar Conta" : "Bem-vindo de Volta"}</h2>
                <p className="text-gray-600">
                  {isSignUp ? "Preencha os dados para começar" : "Acesse sua conta para continuar"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
                {/* Full Name (only for signup) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                    <Input
                      type="text"
                      placeholder="João Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Usuário</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="boomerang"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me (only for login) */}
                {!isSignUp && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-gray-300"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Lembrar de mim
                    </Label>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isSignUp ? "Criando conta..." : "Entrando..."}
                    </>
                  ) : isSignUp ? (
                    "Criar Conta"
                  ) : (
                    "Entrar"
                  )}
                </Button>

                {/* Forgot Password Link (only for login) */}
                {!isSignUp && (
                  <div className="text-center">
                    <a 
                      href="/forgot-password" 
                      className="text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium"
                    >
                      Esqueci minha senha
                    </a>
                  </div>
                )}
              </form>

              {/* Info */}
              {!isSignUp && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">Entre em contato com o administrador para criar sua conta</p>
                </div>
              )}
            </div>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Dados Seguros</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>SSL Certificado</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
