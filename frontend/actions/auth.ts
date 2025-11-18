'use server'

import { registerUserService } from "@/lib/strapi"
import { FormState, SignupFormSchema } from "@/validations/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import z from "zod"

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7, // 1 semana
  path: '/',
  httpOnly: true, // solo se puede leer desde el servidor
  domain: process.env.HOST ?? 'localhost',
  secure: process.env.NODE_ENV === 'production'
}

export async function registerUserAction(prevState: FormState, formData: FormData) {
  
  const fields = {
    username: formData.get('username') as string,
    password: formData.get('password') as string,
    email: formData.get('email') as string,
  }

  const validatedFields = SignupFormSchema.safeParse(fields)

  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error)
    
    return {
      success: false,
      message: "Validation error",
      strapiErrors: null,
      zodErrors: flattenedErrors.fieldErrors,
      data: fields
    }
  }

  const response = await registerUserService(validatedFields.data)

  if (!response || response.error) {
    return {
      success: false,
      message: "Registration error",
      strapiErrors: response?.error,
      zodErrors: null,
      data: fields
    }
  }

  const cookieStore = await cookies()
  cookieStore.set('jwt', response.jwt, cookieConfig)
  redirect('/dashboard')
}