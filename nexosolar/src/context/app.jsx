import { createContext, useContext } from 'react'

// { session, loading, perfil, clientes, cliente, setCliente, esOwner }
export const AppContext = createContext({
  session: null,
  loading: true,
  perfil: null,
  clientes: [],
  cliente: null,
  setCliente: () => {},
  esOwner: false,
})

export const useApp = () => useContext(AppContext)
