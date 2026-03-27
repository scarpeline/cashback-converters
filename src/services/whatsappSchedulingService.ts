// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import {
  getConversation,
  createConversation,
  updateConversation,
  endConversation,
  getMessageTemplate,
  formatMessage,
  WhatsappConversation,
} from "./whatsappConversationService";
import { toast } from "sonner";

// Importar serviços existentes para interagir com o banco de dados
import { getClientByWhatsApp, createClient, Client } from "@/services/clientService";
import { getServices, Service } from "@/services/serviceService";
import { getProfessionals, Professional } from "@/services/professionalService";
import { createAppointment, getClientAppointments, cancelAppointment, getAvailableSlotsForDate } from "@/services/schedulingService";


export const handleIncomingWhatsappMessage = async (
  barbershopId: string,
  clientWhatsapp: string,
  messageBody: string
): Promise<string> => {
  let conversation = await getConversation(barbershopId, clientWhatsapp);
  let responseMessage = "";
  let clientName = conversation?.conversation_state?.client_name || "Cliente";

  // Se não há conversa ativa, ou se a conversa expirou, iniciar uma nova
  if (!conversation || !conversation.is_active || (new Date().getTime() - new Date(conversation.last_message_at).getTime() > 30 * 60 * 1000)) {
    conversation = await createConversation(barbershopId, clientWhatsapp);
    if (!conversation) {
      return "Desculpe, não consegui iniciar a conversa. Por favor, tente novamente mais tarde.";
    }
    const welcomeTemplate = await getMessageTemplate(barbershopId, "welcome_message");
    responseMessage = formatMessage(welcomeTemplate?.template_content || "Olá {client_name}! Bem-vindo(a). Como posso ajudar?\n1. Agendar\n2. Ver Agendamentos\n3. Cancelar", { client_name: clientName });
    await updateConversation(conversation.id, { current_step: "initial", conversation_state: { client_name: clientName } });
    return responseMessage;
  }

  // Atualizar last_message_at
  await updateConversation(conversation.id, { last_message_at: new Date().toISOString() });

  // Processar a mensagem com base no current_step
  switch (conversation.current_step) {
    case "initial":
      responseMessage = await handleInitialStep(conversation, messageBody);
      break;
    case "ask_service":
      responseMessage = await handleAskServiceStep(conversation, messageBody);
      break;
    case "ask_date":
      responseMessage = await handleAskDateStep(conversation, messageBody);
      break;
    case "ask_time":
      responseMessage = await handleAskTimeStep(conversation, messageBody);
      break;
    case "ask_professional":
      responseMessage = await handleAskProfessionalStep(conversation, messageBody);
      break;
    case "confirm_booking":
      responseMessage = await handleConfirmBookingStep(conversation, messageBody);
      break;
    case "view_bookings":
      responseMessage = await handleViewBookingsStep(conversation, messageBody);
      break;
    case "cancel_booking_select":
      responseMessage = await handleCancelBookingSelectStep(conversation, messageBody);
      break;
    case "cancel_booking_confirm":
      responseMessage = await handleCancelBookingConfirmStep(conversation, messageBody);
      break;
    default:
      const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
      responseMessage = formatMessage(invalidInputTemplate?.template_content || "Desculpe, não entendi. Tente novamente.", { client_name: clientName });
      await updateConversation(conversation.id, { current_step: "initial" });
      break;
  }

  return responseMessage;
};

const handleInitialStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";

  switch (messageBody.trim()) {
    case "1":
      const services = await getServices(barbershopId);
      const serviceList = services.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
      await updateConversation(conversation.id, {
        current_step: "ask_service",
        conversation_state: { ...conversation.conversation_state, services, client_name: clientName },
      });
      const askServiceTemplate = await getMessageTemplate(barbershopId, "ask_service");
      return formatMessage(askServiceTemplate?.template_content || "Qual serviço você gostaria de agendar?\n{service_list}", { client_name: clientName, service_list: serviceList });
    case "2":
      await updateConversation(conversation.id, { current_step: "view_bookings" });
      return handleViewBookingsStep(conversation, messageBody);
    case "3":
      await updateConversation(conversation.id, { current_step: "cancel_booking_select" });
      return handleCancelBookingSelectStep(conversation, messageBody);
    case "4":
      await endConversation(conversation.id);
      return "Ok, {client_name}. Um de nossos atendentes entrará em contato em breve.".replace("{client_name}", clientName);
    default:
      const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
      return formatMessage(invalidInputTemplate?.template_content || "Desculpe, não entendi. Tente novamente.", { client_name: clientName });
  }
};

const handleAskServiceStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const services = conversation.conversation_state?.services || [];
  const serviceIndex = parseInt(messageBody.trim()) - 1;

  if (serviceIndex >= 0 && serviceIndex < services.length) {
    const selectedService = services[serviceIndex];
    await updateConversation(conversation.id, {
      current_step: "ask_date",
      conversation_state: { ...conversation.conversation_state, selectedService },
    });
    const askDateTemplate = await getMessageTemplate(barbershopId, "ask_date");
    return formatMessage(askDateTemplate?.template_content || "Para qual data, {client_name}? (Ex: DD/MM/AAAA)", { client_name: clientName });
  } else {
    const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
    return formatMessage(invalidInputTemplate?.template_content || "Serviço inválido. Por favor, escolha um número da lista.", { client_name: clientName });
  }
};

const handleAskDateStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  if (dateRegex.test(messageBody.trim())) {
    const [day, month, year] = messageBody.trim().split('/').map(Number);
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) {
      const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
      return formatMessage(invalidInputTemplate?.template_content || "Data inválida. Por favor, use o formato DD/MM/AAAA.", { client_name: clientName });
    }

    await updateConversation(conversation.id, {
      current_step: "ask_time",
      conversation_state: { ...conversation.conversation_state, selectedDate: date.toISOString().split('T')[0] },
    });
    const askTimeTemplate = await getMessageTemplate(barbershopId, "ask_time");
    return formatMessage(askTimeTemplate?.template_content || "E qual horário, {client_name}? (Ex: HH:MM)", { client_name: clientName });
  } else {
    const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
    return formatMessage(invalidInputTemplate?.template_content || "Data inválida. Por favor, use o formato DD/MM/AAAA.", { client_name: clientName });
  }
};

const handleAskTimeStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (timeRegex.test(messageBody.trim())) {
    const selectedTime = messageBody.trim();
    await updateConversation(conversation.id, {
      current_step: "ask_professional",
      conversation_state: { ...conversation.conversation_state, selectedTime },
    });
    const askProfessionalTemplate = await getMessageTemplate(barbershopId, "ask_professional");
    return formatMessage(askProfessionalTemplate?.template_content || "Com qual profissional, {client_name}? (Se tiver preferência)", { client_name: clientName });
  } else {
    const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
    return formatMessage(invalidInputTemplate?.template_content || "Horário inválido. Por favor, use o formato HH:MM.", { client_name: clientName });
  }
};

const handleAskProfessionalStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const { selectedService, selectedDate, selectedTime } = conversation.conversation_state;

  const professionalName = messageBody.trim();
  let selectedProfessional = null;

  if (professionalName && professionalName.toLowerCase() !== "pular") {
    const professionals = await getProfessionals(barbershopId);
    selectedProfessional = professionals.find(p => p.name.toLowerCase() === professionalName.toLowerCase());
    if (!selectedProfessional) {
      const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
      return formatMessage(invalidInputTemplate?.template_content || "Profissional não encontrado. Por favor, digite o nome correto ou 'pular'.", { client_name: clientName });
    }
  }

  const availableSlots = await getAvailableSlotsForDate(
    barbershopId,
    selectedProfessional?.id || "",
    new Date(selectedDate)
  );

  if (availableSlots.includes(selectedTime)) {
    await updateConversation(conversation.id, {
      current_step: "confirm_booking",
      conversation_state: { ...conversation.conversation_state, selectedProfessional, availableSlots },
    });
    const confirmationTemplate = await getMessageTemplate(barbershopId, "booking_confirmation");
    return formatMessage(
      confirmationTemplate?.template_content || "Confirma seu agendamento de {service_name} com {professional_name} para {date} às {time}? (Sim/Não)",
      {
        client_name: clientName,
        service_name: selectedService.name,
        professional_name: selectedProfessional?.name || "qualquer profissional",
        date: selectedDate,
        time: selectedTime,
      }
    );
  } else {
    const noSlotsTemplate = await getMessageTemplate(barbershopId, "no_slots_available");
    await endConversation(conversation.id);
    return formatMessage(noSlotsTemplate?.template_content || "Desculpe, não há horários disponíveis para {service_name} com {professional_name} em {date} às {time}. Gostaria de tentar outra data/horário?", {
      client_name: clientName,
      service_name: selectedService.name,
      professional_name: selectedProfessional?.name || "o profissional escolhido",
      date: selectedDate,
      time: selectedTime,
    });
  }
};

const handleConfirmBookingStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientWhatsapp = conversation.client_whatsapp;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const { selectedService, selectedDate, selectedTime, selectedProfessional } = conversation.conversation_state;

  if (messageBody.trim().toLowerCase() === "sim") {
    let client = await getClientByWhatsApp(clientWhatsapp);
    if (!client) {
      client = await createClient({ name: clientName, whatsapp: clientWhatsapp });
    }

    if (!client) {
      await endConversation(conversation.id);
      return "Desculpe, {client_name}, não foi possível criar seu cadastro. Por favor, tente novamente.".replace("{client_name}", clientName);
    }

    const result = await createAppointment(
      barbershopId,
      selectedProfessional?.id || "",
      selectedService.id,
      client.id,
      client.name,
      client.whatsapp || clientWhatsapp,
      new Date(`${selectedDate}T${selectedTime}:00Z`)
    );

    if (result) {
      await endConversation(conversation.id);
      const confirmationTemplate = await getMessageTemplate(barbershopId, "booking_confirmation");
      return formatMessage(confirmationTemplate?.template_content || "Seu agendamento de {service_name} com {professional_name} para {date} às {time} foi confirmado. Te esperamos!", {
        client_name: clientName,
        service_name: selectedService.name,
        professional_name: selectedProfessional?.name || "qualquer profissional",
        date: selectedDate,
        time: selectedTime,
      });
    } else {
      await endConversation(conversation.id);
      return "Desculpe, {client_name}, houve um erro ao confirmar seu agendamento. Por favor, tente novamente mais tarde.".replace("{client_name}", clientName);
    }
  } else if (messageBody.trim().toLowerCase() === "não") {
    await endConversation(conversation.id);
    return "Agendamento cancelado. {client_name}, se precisar de algo mais, é só chamar!".replace("{client_name}", clientName);
  } else {
    const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
    return formatMessage(invalidInputTemplate?.template_content || "Por favor, responda 'Sim' ou 'Não'.", { client_name: clientName });
  }
};

const handleViewBookingsStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientWhatsapp = conversation.client_whatsapp;
  const clientName = conversation.conversation_state?.client_name || "Cliente";

  let client = await getClientByWhatsApp(clientWhatsapp);
  if (!client) {
    await endConversation(conversation.id);
    return "Olá {client_name}, não encontramos nenhum agendamento para este número. Você já se cadastrou?".replace("{client_name}", clientName);
  }

  const bookings = await getClientAppointments(client.id);

  if (bookings.length === 0) {
    await endConversation(conversation.id);
    return "Olá {client_name}, você não possui agendamentos futuros.".replace("{client_name}", clientName);
  }

  const bookingList = bookings.map((b: any, i: number) =>
    `${i + 1}. ${b.service_name || 'Serviço'} em ${b.scheduled_at}`
  ).join("\n");

  await endConversation(conversation.id);
  return `Olá {client_name}, seus próximos agendamentos são:\n${bookingList}\n\nSe precisar cancelar ou alterar, envie "3" para cancelar ou "1" para agendar novamente.`.replace("{client_name}", clientName);
};

const handleCancelBookingSelectStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientWhatsapp = conversation.client_whatsapp;
  const clientName = conversation.conversation_state?.client_name || "Cliente";

  let client = await getClientByWhatsApp(clientWhatsapp);
  if (!client) {
    await endConversation(conversation.id);
    return "Olá {client_name}, não encontramos nenhum agendamento para este número. Você já se cadastrou?".replace("{client_name}", clientName);
  }

  const bookings = await getClientAppointments(client.id);
  if (bookings.length === 0) {
    await endConversation(conversation.id);
    return "Olá {client_name}, você não possui agendamentos futuros para cancelar.".replace("{client_name}", clientName);
  }

  const bookingList = bookings.map((b: any, i: number) =>
    `${i + 1}. ${b.service_name || 'Serviço'} em ${b.scheduled_at}`
  ).join("\n");

  await updateConversation(conversation.id, {
    current_step: "cancel_booking_confirm",
    conversation_state: { ...conversation.conversation_state, client, bookings },
  });
  return `Olá {client_name}, qual agendamento você gostaria de cancelar?\n${bookingList}\n\nResponda com o número do agendamento.`.replace("{client_name}", clientName);
};

const handleCancelBookingConfirmStep = async (conversation: WhatsappConversation, messageBody: string): Promise<string> => {
  const barbershopId = conversation.barbershop_id;
  const clientName = conversation.conversation_state?.client_name || "Cliente";
  const bookings = conversation.conversation_state?.bookings || [];
  const bookingIndex = parseInt(messageBody.trim()) - 1;

  if (bookingIndex >= 0 && bookingIndex < bookings.length) {
    const bookingToCancel = bookings[bookingIndex];
    const success = await cancelAppointment(bookingToCancel.id);

    if (success) {
      await endConversation(conversation.id);
      return "Agendamento cancelado com sucesso, {client_name}!".replace("{client_name}", clientName);
    } else {
      await endConversation(conversation.id);
      return "Desculpe, {client_name}, não foi possível cancelar o agendamento. Por favor, tente novamente.".replace("{client_name}", clientName);
    }
  } else {
    const invalidInputTemplate = await getMessageTemplate(barbershopId, "invalid_input");
    return formatMessage(invalidInputTemplate?.template_content || "Número inválido. Por favor, escolha um número da lista.", { client_name: clientName });
  }
};
