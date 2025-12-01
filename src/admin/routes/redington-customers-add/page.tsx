import { defineRouteConfig } from "@medusajs/admin-sdk"
import React, { useState, useEffect } from "react"

type CustomerForm = {
  first_name: string
  last_name: string
  name_prefix: string
  gender: string
  dob: string
  email: string
  phone: string
  phone_country_code: string
  country_id: string
  region_id: string
}

type Country = {
  id: string
  name: string
}

type Region = {
  id: string
  name: string
  code: string
}

const AddCustomerPage: React.FC = () => {
const [form, setForm] = useState<CustomerForm>({
  first_name: "",
  last_name: "",
  name_prefix: "",
  gender: "",
  dob: "",
  email: "",
  phone: "",
  phone_country_code: "",
  country_id: "",
  region_id: ""
})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // New states for countries and regions
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [phonePrefix, setPhonePrefix] = useState("");


  const countryPhoneCodes: Record<string, string> = {
  "1": "+971",  // UAE
  "2": "+254",  // Kenya
  "3": "+966",  // Saudi Arabia
};



  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries()
  }, [])

  // Fetch regions when country changes
  useEffect(() => {
    if (form.country_id) {
      fetchRegions(form.country_id)
    } else {
      setRegions([])
      setForm(prev => ({ ...prev, region_id: "" }))
    }
  }, [form.country_id])

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true)
      const res = await fetch("/admin/mp/countries", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch countries")
      }

      if (data.success) {
        setCountries(data.countries || [])
      }
    } catch (err: any) {
      console.error("Error fetching countries:", err)
      setError("Failed to load countries")
    } finally {
      setLoadingCountries(false)
    }
  }

  const fetchRegions = async (countryId: string) => {
    try {
      setLoadingRegions(true)
      const res = await fetch(`/admin/mp/regions/${countryId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch regions")
      }

      if (data.success) {
        setRegions(data.regions || [])
      }
    } catch (err: any) {
      console.error("Error fetching regions:", err)
      setError("Failed to load regions")
      setRegions([])
    } finally {
      setLoadingRegions(false)
    }
  }

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ) => {
  //   const { name, value } = e.target
  //   setForm((prev) => ({ ...prev, [name]: value }))
  // }
//   const handleChange = (
//   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
// ) => {
//   const { name, value } = e.target;

//   setForm(prev => ({ ...prev, [name]: value }));

//   if (name === "country_id") {
//     setPhonePrefix(countryPhoneCodes[value] || "");
//   }
// };

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  // normal update
  setForm(prev => ({ ...prev, [name]: value }));

  // when country changes
  if (name === "country_id") {
    const code = countryPhoneCodes[value] || "";
    setPhonePrefix(code);
    setForm(prev => ({ ...prev, phone_country_code: code }));  // <-- safe update
  }
};



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

      const today = new Date();
  const minAgeDate = new Date();
  minAgeDate.setFullYear(today.getFullYear() - 13);

  if (new Date(form.dob) > today) {
    setError("Date of birth cannot be in the future");
    setLoading(false);
    return;
  }

  if (new Date(form.dob) > minAgeDate) {
    setError("Customer must be at least 13 years old");
    setLoading(false);
    return;
  }
    if (!form.email || !form.first_name || !form.last_name) {
      setError("Email, first name, and last name are required")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/admin/mp/redington-customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to create customer")
      }

      if (!data.success) {
        throw new Error(data.message)
      }

      setSuccess("Customer added successfully!")
setForm({
  first_name: "",
  last_name: "",
  name_prefix: "",
  gender: "",
  dob: "",
  email: "",
  phone: "",
  phone_country_code:"+00",
  country_id: "",
  region_id: ""
})

      setRegions([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
const today = new Date();
const minAgeDate = new Date();
minAgeDate.setFullYear(today.getFullYear() - 13);

const maxDob = minAgeDate.toISOString().split("T")[0];

  return (
    <div style={wrapper}>
      <div style={header}>
        <h1 style={title}>Add New Customer</h1>
        <button style={backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        {error && (
          <div style={errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div style={successAlert}>
            <strong>Success:</strong> {success}
          </div>
        )}

        <div style={requiredNote}>
          Fields marked with <span style={requiredStar}>*</span> are required
        </div>
        {/* Name Puffix */}

<FormField label="Name Prefix" required>
  <select
    name="name_prefix"
    value={form.name_prefix}
    onChange={handleChange}
    style={select}
    required
  >
    <option value="">Select Title</option>
<option value="Mr.">Mr.</option>
<option value="Ms.">Ms.</option>
<option value="Mrs.">Mrs.</option>
  </select>
</FormField>
        {/* First Name */}
        <FormField label="First Name" required>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter first name"
          />
        </FormField>

        {/* Last Name */}
        <FormField label="Last Name" required>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter last name"
          />
        </FormField>

        {/* Country Selection */}
        <FormField label="Country" required>
          <select
            name="country_id"
            value={form.country_id}
            onChange={handleChange}
            style={select}
            required
          >
            <option value="">Select a country</option>
            {loadingCountries ? (
              <option value="" disabled>Loading countries...</option>
            ) : (
              countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))
            )}
          </select>
        </FormField>

        {/* Region Selection */}
        <FormField label="Region" required>
          <select
            name="region_id"
            value={form.region_id}
            onChange={handleChange}
            style={select}
            required
            disabled={!form.country_id || loadingRegions}
          >
            <option value="">Select a region</option>
            {loadingRegions ? (
              <option value="" disabled>Loading regions...</option>
            ) : regions.length > 0 ? (
              regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {form.country_id ? "No regions available" : "Select a country first"}
              </option>
            )}
          </select>
        </FormField>

        <FormField label="Phone">
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <span style={{
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: 8,
      background: "#f9fafb",
      minWidth: 70,
      textAlign: "center",
      fontSize: 15
    }}>
      {phonePrefix || "+00"}
    </span>

    <input
      name="phone"
      value={form.phone}
      onChange={handleChange}
      style={{ ...input, flex: 1 }}
      placeholder="Enter phone number"
    />
  </div>
</FormField>




        {/* Email */}
        <FormField label="Email" required>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={input}
            required
            placeholder="Enter email address"
          />
        </FormField>





{/* Gender */}
<FormField label="Gender" required>
  <select
    name="gender"
    value={form.gender}
    onChange={handleChange}
    style={select}
    required
  >
    <option value="">Select gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
  </select>
</FormField>

{/* Date of Birth */}
<FormField label="Date of Birth">
  <input
    type="date"
    name="dob"
    value={form.dob}
    onChange={handleChange}
    style={input}
      max={maxDob}
  min="1900-01-01"
  />
</FormField>


        {/* Status Info Note */}
        <div style={infoNote}>
          <strong>Note:</strong> All new customers will be created with "Active" status by default.
          You can change the status later in the customer management section.
        </div>

        <button 
          style={submitBtn} 
          disabled={loading || !form.email || !form.first_name || !form.last_name || !form.country_id || !form.region_id || !form.gender}

          type="submit"
        >
          {loading ? "Saving..." : "Save Customer"}
        </button>
      </form>
    </div>
  )
}

const FormField: React.FC<{ 
  label: string; 
  required?: boolean;
  children: React.ReactNode 
}> = ({
  label,
  required = false,
  children,
}) => (
  <div style={fieldRow}>
    <label style={labelStyle}>
      {label}
      {required && <span style={requiredStar}> *</span>}
    </label>
    {children}
  </div>
)

/* ------------------------------ Updated Styles ------------------------------ */
const wrapper = { 
  padding: "24px", 
  fontFamily: "Inter, sans-serif",
  width: "100%",
}

const header = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  marginBottom: 30 
}

const title = { 
  fontSize: 28, 
  fontWeight: 700,
  margin: 0
}

const backBtn = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14
}

const formBox = {
  background: "#fff",
  padding: 30,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  border: "1px solid #e5e7eb"
}

const fieldRow = {
  display: "flex",
  alignItems: "center",
  marginBottom: 20,
  gap: 20,
}

const labelStyle = {
  width: 180,
  fontWeight: 600,
  fontSize: 14
}

const input = {
  flex: 1,
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 15,
  minWidth: 300
}

const select = {
  flex: 1,
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 15,
  minWidth: 300,
  background: "white"
}

const requiredNote = {
  fontSize: 14,
  color: "#666",
  marginBottom: 20,
  fontStyle: "italic"
}

const requiredStar = {
  color: "#ef4444"
}

const infoNote = {
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  color: "#0369a1",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14,
  lineHeight: 1.5
}

const errorAlert = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14
}

const successAlert = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#16a34a",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 20,
  fontSize: 14
}

const submitBtn = {
  width: "100%",
  padding: 14,
  background: "#1f72ff",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 16,
  marginTop: 10
}

export const config = defineRouteConfig({
  path: "/redington-customer-add",
})

export default AddCustomerPage