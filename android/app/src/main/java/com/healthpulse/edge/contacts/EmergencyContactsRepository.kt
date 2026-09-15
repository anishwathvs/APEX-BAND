package com.healthpulse.edge.contacts

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

data class EmergencyContact(
    val name: String,
    val relation: String,
    val phone: String
)

/**
 * Local-Only Emergency Contacts Repository
 * Stores 1–3 configured phone numbers in private SharedPreferences with zero cloud synchronization.
 */
class EmergencyContactsRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("hp_emergency_contacts_pref", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_CONTACTS = "key_emergency_contacts_json"
    }

    fun getContacts(): List<EmergencyContact> {
        val jsonStr = prefs.getString(KEY_CONTACTS, null)
        if (jsonStr.isNullOrEmpty()) {
            return listOf(
                EmergencyContact("Dr. A. Sharma", "Cardiologist", "+919876543210"),
                EmergencyContact("Ravi Kumar", "Primary Kin", "+919123456789"),
                EmergencyContact("108 Disaster EMS", "National EMS", "108")
            )
        }

        val list = mutableListOf<EmergencyContact>()
        try {
            val arr = JSONArray(jsonStr)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    EmergencyContact(
                        name = obj.getString("name"),
                        relation = obj.getString("relation"),
                        phone = obj.getString("phone")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun saveContacts(contacts: List<EmergencyContact>) {
        val arr = JSONArray()
        contacts.take(3).forEach {
            val obj = JSONObject().apply {
                put("name", it.name)
                put("relation", it.relation)
                put("phone", it.phone)
            }
            arr.put(obj)
        }
        prefs.edit().putString(KEY_CONTACTS, arr.toString()).apply()
    }
}
