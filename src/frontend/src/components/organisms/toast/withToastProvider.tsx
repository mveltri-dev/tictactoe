// Barre d'intégration du ToastProvider pour l'app React
import { ToastProvider } from "@/components/organisms/toast/toast"

export function withToastProvider(Component: React.ComponentType<any>) {
  return function ToastWrapped(props: any) {
    return (
      <ToastProvider>
        <Component {...props} />
      </ToastProvider>
    )
  }
}
