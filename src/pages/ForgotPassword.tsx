import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Package2, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Email enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
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
              Recupere o acesso à sua conta
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              Enviaremos um link de recuperação para seu email cadastrado.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            {[
              "Link seguro enviado para seu email",
              "Defina uma nova senha",
              "Acesso restaurado em minutos",
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * index + 0.5 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Reset Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 shadow-2xl">
            <div className="mb-8">
              <Button
                variant="ghost"
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 mb-4"
                onClick={() => navigate("/auth")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
              <h2 className="text-3xl font-bold text-white mb-2">
                Esqueci minha senha
              </h2>
              <p className="text-gray-400">
                Digite seu email para receber o link de recuperação
              </p>
            </div>

            {emailSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-8"
              >
                <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Email enviado!</h3>
                <p className="text-gray-400">
                  Enviamos um link de recuperação para <span className="text-orange-400">{email}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Verifique sua caixa de entrada e spam
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/auth")}
                >
                  Voltar ao login
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-orange-500 h-12"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>
            )}
          </Card>

          {/* Trust Badges */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Precisa de ajuda?
            </p>
            <p className="text-gray-500 text-xs">
              Entre em contato com o administrador do sistema
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
