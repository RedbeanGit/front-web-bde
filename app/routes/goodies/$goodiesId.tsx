import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useActionData,
  useCatch,
  useLoaderData,
  useOutletContext,
} from "remix";

import GoodiesDisplay from "~/components/goodies/goodiesDisplay";

import {
  generateAlert,
  generateExpectedError,
  generateUnexpectedError,
} from "~/utils/error";

import {
  CreateGoodiesFormData,
  DeleteGoodiesFormData,
  Goodies,
} from "~/models/Goodies";

import { requireAuth } from "~/services/authentication";
import { deleteGoodies, getGoodies, updateGoodies } from "~/services/goodies";
import {
  createPurchase,
  deletePurchase,
  getManyPurchase,
} from "~/services/purchase";

import { Container, Typography } from "@mui/material";
import UpdateGoodiesForm from "~/components/goodies/forms/updateGoodiesForm";
import PurchaseGoodiesForm from "~/components/goodies/forms/purchaseGoodiesForm";
import DeleteGoodiesForm from "~/components/goodies/forms/deleteGoodiesForm";
import PurchasesGrid from "~/components/goodies/grids/purchaseGrid";
import {
  Purchase,
  PurchaseGoodiesFormData,
  RefundGoodiesFormData,
} from "~/models/Purchase";
import { Params } from "react-router";
import { ContextData } from "~/root";
import { User } from "~/models/User";
import { getUser } from "~/services/user";

type LoaderData = {
  goodiesResponse?: {
    error?: string;
    success?: string;
    goodies?: Goodies;
    creatorResponse?: { user?: User; error?: string; success?: string };
  };
  purchaseResponse?: {
    error?: string;
    success?: string;
    purchases?: Purchase[];
  };
};

type ActionData = {
  purchaseGoodiesResponse?: {
    formData?: PurchaseGoodiesFormData;
    success?: string;
    error?: string;
  };
  updateGoodiesResponse?: {
    formData?: CreateGoodiesFormData;
    success?: string;
    error?: string;
  };
  deleteGoodiesResponse?: {
    formData?: DeleteGoodiesFormData;
    success?: string;
    error?: string;
  };
  refundGoodiesResponse?: {
    formData?: RefundGoodiesFormData;
    success?: string;
    error?: string;
  };
};

async function loadPurchase(
  token: string,
  goodiesId?: number,
  userId?: number
) {
  const { code, ...purchaseResponse } = await getManyPurchase(
    token,
    100,
    0,
    goodiesId,
    userId
  );

  return purchaseResponse;
}

async function loadGoodiesCreator(token: string, creatorId: number) {
  const { code, ...userResponse } = await getUser(token, creatorId);

  return userResponse;
}

async function loadGoodies(token: string, goodiesId: number, userId?: number) {
  const { code, ...goodiesResponse } = await getGoodies(token, goodiesId);

  return json(
    {
      goodiesResponse: {
        ...goodiesResponse,
        creatorResponse:
          goodiesResponse.goodies?.creatorId &&
          loadGoodiesCreator(token, goodiesResponse.goodies?.creatorId),
      },
      purchaseResponse: loadPurchase(
        token,
        goodiesResponse.goodies?.id,
        userId
      ),
    } as LoaderData,
    code
  );
}

export const loader: LoaderFunction = async ({
  request,
  params,
  context,
}: {
  request: Request;
  params: Params<string>;
  context: ContextData;
}) => {
  if (!params.goodiesId) {
    throw json("Invalid goodies query", 404);
  }

  const token = await requireAuth(request, `/goodies/${params.goodiesId}`);

  const userInfo = context.userInfo;

  return await loadGoodies(token, parseInt(params.goodiesId), userInfo?.id);
};

async function handleCreatePurchase(token: string, goodiesId: number) {
  const { code, ...purchaseGoodiesResponse } = await createPurchase(token, {
    goodiesId: goodiesId,
  });

  return json({ purchaseGoodiesResponse } as ActionData, code);
}

//Validator for price fiels
function validatePrice(price: number) {
  if (price < 0) {
    return "Price must be positive";
  }
}

//Validator for buy limit field
function validateBuyLimit(buyLimit: number) {
  if (buyLimit < 1) {
    return "Buy limit must be more than 1";
  }
}

async function handleUpdateGoodies(
  token: string,
  name: string,
  description: string,
  price: number,
  buyLimit: number,
  goodiesId: number
) {
  const fields = {
    name,
    description,
    price: price,
    buyLimit: buyLimit,
  };
  const fieldsError = {
    reward: validatePrice(price),
    buyLimit: validateBuyLimit(buyLimit),
  };

  if (Object.values(fieldsError).some(Boolean)) {
    return json(
      { updateGoodiesResponse: { fields, fieldsError } } as ActionData,
      400
    );
  }

  const { code, ...updateGoodiesResponse } = await updateGoodies(
    token,
    fields,
    goodiesId
  );

  return json(
    {
      updateGoodiesResponse: {
        ...updateGoodiesResponse,
        formData: { fields, fieldsError },
      },
    } as ActionData,
    code
  );
}

async function handleDeleteGoodies(token: string, goodiesId: number) {
  const { code, ...deleteGoodiesResponse } = await deleteGoodies(
    token,
    goodiesId
  );

  if (deleteGoodiesResponse.error) {
    return json({ deleteGoodiesResponse } as ActionData, code);
  }

  return redirect("/goodies");
}

async function handleRefundGoodies(token: string, purchaseId: number) {
  const { code, ...refundGoodiesResponse } = await deletePurchase(
    token,
    purchaseId
  );

  return json({ refundGoodiesResponse } as ActionData, code);
}

export const action: ActionFunction = async ({ request, params, context }) => {
  if (!params.goodiesId) {
    return json(
      {
        updateGoodiesResponse: { error: "Invalid goodies query" },
      } as ActionData,
      404
    );
  }

  const token = await requireAuth(request, `/goodies/${params.challengeId}`);

  //TODO : remove method & use REST routes
  //Initialize form fields
  const form = await request.formData();

  switch (request.method) {
    case "PUT":
      return await handleCreatePurchase(token, parseInt(params.goodiesId));
    case "PATCH":
      //Goodies update fields
      const name = form.get("name");
      const description = form.get("description");
      const price = form.get("price");
      const buyLimit = form.get("buy-limit");

      if (
        typeof name !== "string" ||
        typeof description !== "string" ||
        typeof price !== "string" ||
        typeof buyLimit !== "string"
      ) {
        return json(
          {
            updateGoodiesResponse: {
              error:
                "Invalid data provided, please check if you have fill all the requierd fields",
            },
          } as ActionData,
          400
        );
      }

      return await handleUpdateGoodies(
        token,
        name,
        description,
        parseInt(price),
        parseInt(buyLimit),
        parseInt(params.goodiesId)
      );
    case "DELETE":
      const kind = form.get("kind");

      if (typeof kind !== "string") {
        return json(
          {
            deleteGoodiesResponse: {
              error: "There was an error, please try again",
            },
          } as ActionData,
          500
        );
      }

      switch (kind) {
        case "goodies":
          return await handleDeleteGoodies(token, parseInt(params.goodiesId));

        case "purchase":
          const purchaseId = new URL(request.url).searchParams.get(
            "purchaseId"
          );

          if (!purchaseId) {
            return json(
              {
                purchaseGoodiesResponse: { error: "Invalid purchase query" },
              } as ActionData,
              404
            );
          }

          return await handleRefundGoodies(token, parseInt(purchaseId));

        default:
          return json(
            {
              deleteGoodiesResponse: { error: "Bad request kind" },
            } as ActionData,
            404
          );
      }

    default:
      throw json("Bad request method", 404);
  }
};

// For the creator of the goodies, replace displays by inputs
function displayGoodies(
  goodies: Goodies,
  formData: {
    updateForm?: CreateGoodiesFormData;
    deleteForm?: DeleteGoodiesFormData;
  },
  creator?: User,
  userId?: number
) {
  if (goodies?.creatorId === userId) {
    return (
      <div>
        <UpdateGoodiesForm
          creator={creator}
          goodies={goodies}
          formData={formData?.updateForm}
        />
        <DeleteGoodiesForm goodies={goodies} formData={formData?.deleteForm} />
      </div>
    );
  } else {
    return (
      <div>
        <GoodiesDisplay goodies={goodies} />
      </div>
    );
  }
}

export default function Goodies() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  const userInfo = useOutletContext<ContextData>().userInfo;

  return (
    <Container style={{ marginTop: "50px" }} component="main">
      <Container maxWidth="xs">
        <Typography variant="h4">Goodies</Typography>
        {generateAlert("error", loaderData.goodiesResponse?.error)}
        {generateAlert("error", actionData?.updateGoodiesResponse?.error)}
        {generateAlert("success", actionData?.updateGoodiesResponse?.success)}
        {generateAlert("error", actionData?.deleteGoodiesResponse?.error)}
        {generateAlert("success", actionData?.deleteGoodiesResponse?.success)}
        {loaderData.goodiesResponse?.goodies && (
          <div>
            {displayGoodies(
              loaderData.goodiesResponse?.goodies,
              {
                updateForm: actionData?.updateGoodiesResponse?.formData,
                deleteForm: actionData?.deleteGoodiesResponse?.formData,
              },
              loaderData.goodiesResponse.creatorResponse?.user,
              userInfo?.id
            )}
            <PurchaseGoodiesForm
              goodies={loaderData.goodiesResponse?.goodies}
              formData={actionData?.purchaseGoodiesResponse?.formData}
            />
          </div>
        )}
      </Container>
      <div style={{ marginTop: "50px" }}>
        <Typography textAlign="center" variant="h4">
          Undelivered purchases
        </Typography>
        {generateAlert("error", loaderData.purchaseResponse?.error)}
        {generateAlert("error", actionData?.purchaseGoodiesResponse?.error)}
        {generateAlert("success", actionData?.purchaseGoodiesResponse?.success)}
        {generateAlert("error", actionData?.refundGoodiesResponse?.error)}
        {generateAlert("success", actionData?.refundGoodiesResponse?.success)}
        {loaderData.purchaseResponse?.purchases && (
          <PurchasesGrid
            purchases={loaderData.purchaseResponse.purchases}
            formData={actionData?.refundGoodiesResponse?.formData}
          />
        )}
      </div>
    </Container>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return generateExpectedError(caught);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return generateUnexpectedError(error);
}
