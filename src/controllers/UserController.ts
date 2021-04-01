import { Request, Response } from 'express'
import { getCustomRepository } from 'typeorm'
import { UsersRepository } from '../repositories/UsersRepository'
import * as yup from 'yup'
import { AppError } from '../errors/AppError'

class UserController {
  async create(request: Request, response: Response) {
    const { name, email } = request.body

    const schema = yup.object().shape({
      name: yup.string().required('Name is required'),
      email: yup.string().email().required('Email is required')
    })
    // if(!(await schema.isValid(request.body))) {
    //   return response.status(400).json({ error: 'Validation Failed!' })
    // }
    try {
      await schema.validate(request.body, {abortEarly: false})
    } catch (err) {
      throw new AppError(err.errors)
    }

    const usersRepository = getCustomRepository(UsersRepository)
    const userAlreadyExists = await usersRepository.findOne({email})
    if(userAlreadyExists) throw new AppError('User already exists', 406)
    const user = usersRepository.create({
      name, email
    })
    await usersRepository.save(user)

    return response.status(201).json(user)
  }

  async show(request: Request, response: Response) {
    const userRepository = getCustomRepository(UsersRepository)

    const all = await userRepository.find()

    return response.status(200).json(all)
  }
}

export { UserController }
