import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    full_name: ""
  });
  const navigate = useNavigate();
  const { data: systemSettings } = useQuery({
    queryKey: ["sisapi-public-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_settings").select("general_settings").maybeSingle();
      return data?.general_settings as any;
    }
  });



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login padrão temporário: admin@gemail.com / admin
      if (email === "admin@gemail.com" && password === "admin") {
        toast.success("Login administrativo realizado com sucesso!");
        localStorage.setItem("sb-dummy-session", "true");
        // Força recarregamento para o AuthContext detectar a nova sessão dummy
        window.location.href = "/modules";
        return;
      }


      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Login realizado com sucesso!");
      navigate("/modules");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.full_name,
          },
        },
      });

      if (error) throw error;
      
      toast.success("Cadastro realizado! Verifique seu e-mail ou faça login.");
      setIsSignUpOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar os módulos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário ou Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@gemail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="w-full text-center">
              <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm">
                    Não tem uma conta? Cadastre-se
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSignUp}>
                    <DialogHeader>
                      <DialogTitle>Criar Conta</DialogTitle>
                      <DialogDescription>
                        Preencha os dados abaixo para se cadastrar no sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="signup-name">Nome Completo</Label>
                        <Input
                          id="signup-name"
                          placeholder="Seu nome"
                          value={signUpData.full_name}
                          onChange={(e) => setSignUpData({ ...signUpData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Cadastrar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>



          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
