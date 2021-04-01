import { Request, Response } from "express"
import { resolve } from 'path'
import { getCustomRepository } from "typeorm"
import { AppError } from "../errors/AppError"
import { SurveysRepository } from "../repositories/SurveysRespository"
import { SurveysUsersRepository } from "../repositories/SurveysUsersRespository"
import { UsersRepository } from "../repositories/UsersRepository"
import SendMailService from "../services/SendMailService"

class SendMailController {
  async execute(request: Request, response: Response) {
    const { email, survey_id } = request.body;

    const usersRepository = getCustomRepository(UsersRepository)
    const surveysRepository = getCustomRepository(SurveysRepository)
    const surveysUsersRepository = getCustomRepository(SurveysUsersRepository)

    const userExists = await usersRepository.findOne({ email })
    if(!userExists) throw new AppError('User does not exists!', 404)

    const surveyExists = await surveysRepository.findOne({ id: survey_id })
    if(!surveyExists) throw new AppError('Survey does not exists!', 404)

    const npsPath = resolve(__dirname, '..', 'views', 'emails', 'npsMail.hbs')

    const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
      where: {user_id: userExists.id, value: null},
      relations: ['user', 'survey']
    })

    const variables = {
      name: userExists.name,
      title: surveyExists.title,
      description: surveyExists.description,
      id: '',
      link: process.env.URL_MAIL
    }

    if(surveyUserAlreadyExists) {
      variables.id = surveyUserAlreadyExists.id
      await SendMailService.execute(email, surveyExists.title, variables, npsPath)
      return response.json(surveyUserAlreadyExists)
    }

    // Salvar as informações na tabela users
    const surveyUser = surveysUsersRepository.create({
      user_id: userExists.id,
      survey_id
    })
    await surveysUsersRepository.save(surveyUser)
    
    // Enviar e-mail para o usuário
    variables.id = surveyUser.id
    await SendMailService.execute(email, surveyExists.title, variables, npsPath)

    return response.status(201).json(surveyUser)
  }
}

export { SendMailController }