import { Alert, Container, Grid } from "@mui/material";
import { useContext } from "react";
import { Accomplishment, Validation } from "~/models/Accomplishment";
import { UserContext } from "../userContext";
import AccomplishmentTile, {
  ValidateAccomplishmentFormData,
} from "./accomplishmentTile";
import DeleteAccomplishmentForm, {
  DeleteAccomplishmentFormData,
} from "./deleteAccomplishmentForm";
import UpdateAccomplishmentForm, {
  UpdateAccomplishmentFormData,
} from "./updateAccomplishmentForm";

export type AccomplishmentData = {
  accomplishments?: Accomplishment[];
  error?: string;
};

function displayAccomplishment(
  accomplishment: Accomplishment,
  userPrivilege?: number,
  updateFormData?: UpdateAccomplishmentFormData,
  deleteFormData?: DeleteAccomplishmentFormData,
  validateFormData?: ValidateAccomplishmentFormData
) {
  switch (accomplishment.validation) {
    case "PENDING":
      console.log("coco");
      return (
        <div>
          <UpdateAccomplishmentForm
            accomplishment={accomplishment}
            formData={updateFormData}
          />
          <DeleteAccomplishmentForm
            accomplishment={accomplishment}
            formData={deleteFormData}
          />
        </div>
      );
    default:
      console.log("coucoueee");
      return (
        <AccomplishmentTile
          accomplishment={accomplishment}
          userPrivilege={userPrivilege}
          formData={validateFormData}
        />
      );
  }
}

export default function AccomplishmentsGrid({
  accomplishments,
  formData,
}: {
  accomplishments: AccomplishmentData;
  formData?: {
    updateAccomplishment?: UpdateAccomplishmentFormData;
    deleteAccomplishment?: DeleteAccomplishmentFormData;
    validateAccomplishment?: ValidateAccomplishmentFormData;
  };
}) {
  const userInfo = useContext(UserContext);

  console.log(accomplishments);

  return (
    <Container style={{ marginTop: "50px", marginBottom: "50px" }}>
      {accomplishments.error ? (
        <Alert severity="error">{accomplishments.error}</Alert>
      ) : (
        ""
      )}
      <Grid
        textAlign="center"
        container
        style={{ marginTop: "10px" }}
        spacing={{ xs: 2, md: 3 }}
        columns={{ xs: 1, sm: 8, md: 12 }}
      >
        {/* Display the user's accomplishments */}
        {accomplishments.accomplishments?.map((accomplishment) => {
          {
            console.log("test");
          }
          <Grid item key={accomplishment.id}>
            {displayAccomplishment(
              accomplishment,
              userInfo?.privilege,
              formData?.updateAccomplishment,
              formData?.deleteAccomplishment,
              formData?.validateAccomplishment
            )}
          </Grid>;
        })}
      </Grid>
    </Container>
  );
}
